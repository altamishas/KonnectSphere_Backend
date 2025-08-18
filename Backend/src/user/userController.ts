import User from "./userModel";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";
import createHttpError from "http-errors";
import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { AuthRequest } from "../middlewares/tokenVerification";
import { calculateOTPExpiry, generateOTP } from "../utils/otp-util";
import emailService from "../utils/emailService";
import cloudinary from "../config/cloudinaryConfig";
import fs from "fs";

// Define interface for user with investor fields
interface UserWithInvestorFields {
  professionalBackground?: string;
  areasOfExpertise?: string[];
  investmentRange?: { min: number; max: number };
  preferredIndustries?: string[];
  investmentStage?: string[];
  pastInvestments?: number;
  linkedinUrl?: string;
  website?: string;
}

// Define interface for company data
interface CompanyData {
  id?: string;
  companyName: string;
  position: string;
  description: string;
  website?: string;
  logo?: {
    public_id?: string;
    url?: string;
  };
  logoUrl?: string;
}

const registerUser = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = createHttpError(403, "Validation error occurred");
    error.stack = errors
      .array()
      .map((err) => err.msg)
      .join(",");
    console.log(error.stack);
    return next(error);
  }
  const {
    fullName,
    email,
    password,
    role,
    subscriptionPlan,
    agreedToTerms,
    isAccreditedInvestor,
  } = req.body;

  // Generate OTP for email verification
  const otp = generateOTP(6);
  const otpExpiry = calculateOTPExpiry(10); // 10 minutes expiry

  // Password hashing and user creation
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const userObj = new User({
        fullName,
        email,
        password: hashedPassword,
        role: role || "Entrepreneur",
        subscriptionPlan: subscriptionPlan || "Free",
        agreedToTerms,
        isAccreditedInvestor:
          role === "Investor" ? isAccreditedInvestor : false,
        isInvestorProfileComplete: role === "Entrepreneur",
        // Email verification fields
        isEmailVerified: false,
        emailVerificationOTP: otp,
        emailVerificationOTPExpires: otpExpiry,
      });

      return userObj.save();
    })
    .then(async (user) => {
      try {
        // Send verification email
        await emailService.sendEmailVerificationOTP(email, otp, fullName);

        // Return user ID for the frontend to use in verification
        res.status(200).json({
          message:
            "Registration initiated. Check your email for verification code.",
          userId: user._id,
        });
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Delete the created user if email fails
        await User.findByIdAndDelete(user._id);
        return next(
          createHttpError(
            500,
            "Failed to send verification email. Please try again."
          )
        );
      }
    })
    .catch((err) => {
      return next(
        createHttpError(500, "Server error during user creation", err)
      );
    });
};
const loginUser = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = createHttpError(403, "Validation error occurred");
    error.stack = errors
      .array()
      .map((err) => err.msg)
      .join(",");
    console.log(error.stack);
    return next(error);
  }

  const { email, password } = req.body;

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        const error = createHttpError(404, "User not found, incorrect email");
        return next(error);
      }
      if (!user.isEmailVerified) {
        return next(
          createHttpError(403, "Please verify your email before logging in")
        );
      }

      bcrypt
        .compare(password, user.password)
        .then((match) => {
          if (!match) {
            const error = createHttpError(403, "Password not matched");
            return next(error);
          }

          const token = sign(
            { sub: user._id },
            config.JSON_WEB_TOKEN_SECRET as string,
            {
              expiresIn: "3d",
            }
          );

          // Set only the auth token cookie
          res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "deployment",
            sameSite: "none",
            maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
          });

          res.status(200).json({
            message: "User logged in successfully",
            token: token,
          });
        })
        .catch(() => {
          return next(
            createHttpError(404, "User not found, incorrect email or password")
          );
        });
    })
    .catch(() => {
      return next(createHttpError(500, "Error during login"));
    });
};
const getUserProfile = (req: Request, res: Response, next: NextFunction) => {
  const _req = req as AuthRequest;
  const userId = _req.userId;

  User.findById(userId)
    .select("-password") // Exclude the password field
    .then((user) => {
      if (!user) {
        const error = createHttpError(404, "User not found");
        return next(error);
      }
      res.status(200).json({
        message: "User profile fetched successfully",
        user,
      });
    })
    .catch(() => {
      return next(createHttpError(500, "Error fetching user profile"));
    });
};
const updateUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const _req = req as AuthRequest;
    const userId = _req.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const {
      fullName,
      bio,
      countryName,
      cityName,
      phoneNumber,
      mobileNumber,
      isAccreditedInvestor,
      // Investor-specific fields
      professionalBackground,
      areasOfExpertise,
      investmentRange,
      preferredIndustries,
      investmentStage,
      pastInvestments,
      linkedinUrl,
      website,
      // Investment preferences
      investmentPreferences,
      // Profile info
      profileInfo,
      // Profile completion status
      isInvestorProfileComplete,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Handle file uploads (avatar and banner)
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | Express.Multer.File[]
      | undefined;

    console.log("🔍 Files received:", files);
    console.log(
      "🔍 Files type:",
      Array.isArray(files) ? "array" : typeof files
    );
    console.log("🔍 All form data keys:", Object.keys(req.body));

    // Check for avatar file - handle both upload.fields() and upload.any() formats
    let avatarFile: Express.Multer.File | null = null;
    let bannerFile: Express.Multer.File | null = null;

    if (files) {
      if (Array.isArray(files)) {
        // upload.any() format - files is an array
        console.log("📁 Processing files array format");
        for (const file of files) {
          console.log(`📄 File found:`, {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          });

          if (file.mimetype.startsWith("image/")) {
            if (
              file.fieldname === "avatarImage" ||
              (!avatarFile &&
                file.originalname.toLowerCase().includes("avatar"))
            ) {
              avatarFile = file;
              console.log(`📸 Using file as avatar: ${file.originalname}`);
            } else if (
              file.fieldname === "bannerImage" ||
              (!bannerFile &&
                file.originalname.toLowerCase().includes("banner"))
            ) {
              bannerFile = file;
              console.log(`🖼️ Using file as banner: ${file.originalname}`);
            }
          }
        }
      } else {
        // upload.fields() format - files is an object
        console.log("📁 Processing files object format");
        console.log("📁 Available fields:", Object.keys(files));

        if (files.avatarImage?.[0]) {
          avatarFile = files.avatarImage[0];
          console.log("📸 Found avatar in 'avatarImage' field");
        }

        if (files.bannerImage?.[0]) {
          bannerFile = files.bannerImage[0];
          console.log("🖼️ Found banner in 'bannerImage' field");
        }
      }
    }

    // Ensure uploads directory exists
    const uploadsDir = "public/data/uploads";
    if (!fs.existsSync(uploadsDir)) {
      console.log("📁 Creating uploads directory:", uploadsDir);
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Update avatar image if provided
    if (avatarFile) {
      console.log("📸 Processing avatar upload:", {
        filename: avatarFile.filename,
        originalname: avatarFile.originalname,
        size: avatarFile.size,
        path: avatarFile.path,
        fieldname: avatarFile.fieldname,
      });

      try {
        // Delete existing avatar if it exists
        if (user.avatarImage?.public_id) {
          console.log(
            "🗑️ Deleting existing avatar:",
            user.avatarImage.public_id
          );
          await cloudinary.uploader.destroy(user.avatarImage.public_id);
          console.log("✅ Previous avatar deleted successfully");
        }

        // Upload new avatar to Cloudinary
        console.log("☁️ Uploading new avatar to Cloudinary...");
        const avatarResult = await cloudinary.uploader.upload(avatarFile.path, {
          folder: "avatars",
          transformation: [
            { width: 200, height: 200, crop: "fill", gravity: "face" },
          ],
          resource_type: "auto", // Let Cloudinary auto-detect file type
        });

        console.log("✅ Avatar uploaded successfully:", {
          public_id: avatarResult.public_id,
          url: avatarResult.secure_url,
        });

        user.avatarImage = {
          public_id: avatarResult.public_id,
          url: avatarResult.secure_url,
        };

        // Clean up temporary file
        try {
          fs.unlinkSync(avatarFile.path);
          console.log("🧹 Temporary file cleaned up");
        } catch (cleanupError) {
          console.warn("⚠️ Failed to cleanup temporary file:", cleanupError);
          // Don't fail the entire operation for cleanup issues
        }
      } catch (uploadError) {
        console.error("❌ Avatar upload error:", uploadError);

        // Clean up temporary file even if upload failed
        try {
          fs.unlinkSync(avatarFile.path);
        } catch {
          // Ignore cleanup errors
        }

        res.status(500).json({
          message: "Failed to upload avatar image",
          error:
            uploadError instanceof Error
              ? uploadError.message
              : "Unknown error",
        });
        return;
      }
    } else {
      console.log("📷 No avatar image provided in request");
    }

    // Update banner image if provided
    if (bannerFile) {
      try {
        // Delete existing banner if it exists
        if (user.bannerImage?.public_id) {
          await cloudinary.uploader.destroy(user.bannerImage.public_id);
        }

        // Upload new banner
        const bannerResult = await cloudinary.uploader.upload(bannerFile.path, {
          folder: "banners",
          transformation: [{ width: 1200, height: 400, crop: "fill" }],
        });

        user.bannerImage = {
          public_id: bannerResult.public_id,
          url: bannerResult.secure_url,
        };

        // Clean up temporary file
        fs.unlinkSync(bannerFile.path);
      } catch (uploadError) {
        console.error("Banner upload error:", uploadError);
        res.status(500).json({ message: "Failed to upload banner image" });
        return;
      }
    }

    // Update basic profile fields
    if (fullName !== undefined) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (countryName !== undefined) user.countryName = countryName;
    if (cityName !== undefined) user.cityName = cityName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (mobileNumber !== undefined) user.mobileNumber = mobileNumber;
    if (isAccreditedInvestor !== undefined)
      user.isAccreditedInvestor = isAccreditedInvestor;

    // Update investor-specific fields (only for investors)
    if (user.role === "Investor") {
      if (professionalBackground !== undefined) {
        (user as UserWithInvestorFields).professionalBackground =
          professionalBackground;
      }
      if (areasOfExpertise !== undefined) {
        // Parse comma-separated string if needed
        let parsedAreas = areasOfExpertise;
        if (typeof areasOfExpertise === "string") {
          parsedAreas = areasOfExpertise
            .split(",")
            .map((area: string) => area.trim())
            .filter((area: string) => area.length > 0);
        }
        (user as UserWithInvestorFields).areasOfExpertise = parsedAreas;
      }
      if (investmentRange !== undefined) {
        (user as UserWithInvestorFields).investmentRange = investmentRange;
      }
      if (preferredIndustries !== undefined) {
        // Parse comma-separated string if needed
        let parsedIndustries = preferredIndustries;
        if (typeof preferredIndustries === "string") {
          parsedIndustries = preferredIndustries
            .split(",")
            .map((industry: string) => industry.trim())
            .filter((industry: string) => industry.length > 0);
        }
        (user as UserWithInvestorFields).preferredIndustries = parsedIndustries;
      }
      if (investmentStage !== undefined) {
        (user as UserWithInvestorFields).investmentStage = investmentStage;
      }
      if (pastInvestments !== undefined) {
        (user as UserWithInvestorFields).pastInvestments =
          parseInt(pastInvestments);
      }
      if (linkedinUrl !== undefined) {
        (user as UserWithInvestorFields).linkedinUrl = linkedinUrl;
      }
      if (website !== undefined) {
        (user as UserWithInvestorFields).website = website;
      }

      // Update investment preferences (only for investors)
      if (investmentPreferences !== undefined) {
        try {
          const preferences =
            typeof investmentPreferences === "string"
              ? JSON.parse(investmentPreferences)
              : investmentPreferences;

          // Initialize investmentPreferences if it doesn't exist
          if (!user.investmentPreferences) {
            user.investmentPreferences = {
              investmentRangeMin: 1000,
              investmentRangeMax: 100000,
              maxInvestmentsPerYear: 1,
              interestedLocations: [],
              interestedIndustries: [],
              investmentStages: [], // Added missing field
              pitchCountries: [],
              languages: [],
              additionalCriteria: "",
            };
          }

          // Update individual properties
          if (preferences.investmentRangeMin !== undefined) {
            user.investmentPreferences!.investmentRangeMin =
              preferences.investmentRangeMin;
          }
          if (preferences.investmentRangeMax !== undefined) {
            user.investmentPreferences!.investmentRangeMax =
              preferences.investmentRangeMax;
          }
          if (preferences.maxInvestmentsPerYear !== undefined) {
            user.investmentPreferences!.maxInvestmentsPerYear =
              preferences.maxInvestmentsPerYear;
          }
          if (preferences.interestedLocations !== undefined) {
            user.investmentPreferences!.interestedLocations =
              preferences.interestedLocations;
          }
          if (preferences.interestedIndustries !== undefined) {
            user.investmentPreferences!.interestedIndustries =
              preferences.interestedIndustries;
          }
          if (preferences.investmentStages !== undefined) {
            user.investmentPreferences!.investmentStages =
              preferences.investmentStages;
          }
          if (preferences.pitchCountries !== undefined) {
            user.investmentPreferences!.pitchCountries =
              preferences.pitchCountries;
          }
          if (preferences.languages !== undefined) {
            user.investmentPreferences!.languages = preferences.languages;
          }
          if (preferences.additionalCriteria !== undefined) {
            user.investmentPreferences!.additionalCriteria =
              preferences.additionalCriteria;
          }
        } catch (error) {
          console.error("Error parsing investment preferences:", error);
          res
            .status(400)
            .json({ message: "Invalid investment preferences format" });
          return;
        }
      }

      // Update profile info (only for investors)
      if (profileInfo !== undefined) {
        try {
          const profile =
            typeof profileInfo === "string"
              ? JSON.parse(profileInfo)
              : profileInfo;

          // Initialize profileInfo if it doesn't exist
          if (!user.profileInfo) {
            user.profileInfo = {
              linkedinUrl: "",
              instagramUrl: "",
              facebookUrl: "",
              twitterUrl: "",
              skypeId: "",
              personalWebsite: "",
              aboutMe: "",
              specializedField: "",
              previousInvestments: 0,
              areasOfExpertise: [],
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              companies: [] as any, // Mongoose DocumentArray type
            };
          }

          // Update social media and profile fields
          if (profile.linkedinUrl !== undefined) {
            user.profileInfo!.linkedinUrl = profile.linkedinUrl;
          }
          if (profile.instagramUrl !== undefined) {
            user.profileInfo!.instagramUrl = profile.instagramUrl;
          }
          if (profile.facebookUrl !== undefined) {
            user.profileInfo!.facebookUrl = profile.facebookUrl;
          }
          if (profile.twitterUrl !== undefined) {
            user.profileInfo!.twitterUrl = profile.twitterUrl;
          }
          if (profile.skypeId !== undefined) {
            user.profileInfo!.skypeId = profile.skypeId;
          }
          if (profile.personalWebsite !== undefined) {
            user.profileInfo!.personalWebsite = profile.personalWebsite;
          }
          if (profile.aboutMe !== undefined) {
            user.profileInfo!.aboutMe = profile.aboutMe;
          }
          if (profile.specializedField !== undefined) {
            user.profileInfo!.specializedField = profile.specializedField;
          }
          if (profile.previousInvestments !== undefined) {
            user.profileInfo!.previousInvestments = profile.previousInvestments;
          }
          if (profile.areasOfExpertise !== undefined) {
            user.profileInfo!.areasOfExpertise = Array.isArray(
              profile.areasOfExpertise
            )
              ? profile.areasOfExpertise
              : profile.areasOfExpertise
                  .split(",")
                  .map((s: string) => s.trim());
          }

          // Handle company logos and data
          if (profile.companies !== undefined) {
            // Ensure profileInfo exists
            if (!user.profileInfo) {
              user.profileInfo = {
                linkedinUrl: "",
                instagramUrl: "",
                facebookUrl: "",
                twitterUrl: "",
                skypeId: "",
                personalWebsite: "",
                aboutMe: "",
                specializedField: "",
                previousInvestments: 0,
                areasOfExpertise: [],
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                companies: [] as any,
              };
            }

            // Initialize companies array if it doesn't exist
            if (!user.profileInfo.companies) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              user.profileInfo.companies = [] as any;
            }

            const updatedCompanies = await Promise.all(
              profile.companies.map(
                async (company: CompanyData, index: number) => {
                  let logoFile: Express.Multer.File | undefined = undefined;

                  // Handle company logo files with proper type checking
                  if (files && !Array.isArray(files)) {
                    const logoFieldName = `companyLogo_${index}`;
                    logoFile = files[logoFieldName]?.[0];
                  }

                  let logoData = company.logo || {};

                  if (logoFile) {
                    try {
                      // Delete existing logo if it exists
                      if (company.logo?.public_id) {
                        await cloudinary.uploader.destroy(
                          company.logo.public_id
                        );
                      }

                      // Upload new logo
                      const logoResult = await cloudinary.uploader.upload(
                        logoFile.path,
                        {
                          folder: "company-logos",
                          transformation: [
                            { width: 200, height: 200, crop: "fit" },
                          ],
                        }
                      );

                      logoData = {
                        public_id: logoResult.public_id,
                        url: logoResult.secure_url,
                      };

                      // Clean up temporary file
                      fs.unlinkSync(logoFile.path);
                    } catch (uploadError) {
                      console.error(
                        `Company logo upload error for index ${index}:`,
                        uploadError
                      );
                    }
                  }

                  return {
                    id: company.id || Date.now().toString(),
                    companyName: company.companyName,
                    position: company.position,
                    description: company.description,
                    website: company.website || "",
                    logo: logoData,
                    logoUrl: logoData.url || company.logoUrl || "",
                  };
                }
              )
            );

            // Ensure profileInfo exists before assignment
            if (user.profileInfo) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              user.profileInfo.companies = updatedCompanies as any;
            }
          }
        } catch (error) {
          console.error("Error parsing profile info:", error);
          res.status(400).json({ message: "Invalid profile info format" });
          return;
        }
      }

      // Check if investor profile should be marked as complete
      if (user.role === "Investor" && isInvestorProfileComplete !== undefined) {
        // Validate that all required fields are present for completion
        const hasRequiredProfileInfo =
          user.profileInfo?.aboutMe &&
          user.profileInfo?.areasOfExpertise &&
          user.profileInfo.areasOfExpertise.length > 0 &&
          user.profileInfo?.previousInvestments !== undefined;

        const hasRequiredInvestmentPrefs =
          user.investmentPreferences?.investmentRangeMin &&
          user.investmentPreferences?.investmentRangeMax &&
          user.investmentPreferences?.maxInvestmentsPerYear &&
          user.investmentPreferences?.interestedIndustries &&
          user.investmentPreferences.interestedIndustries.length > 0;

        if (hasRequiredProfileInfo && hasRequiredInvestmentPrefs) {
          user.isInvestorProfileComplete = true;
        } else {
          console.log("Profile completion validation failed:", {
            hasRequiredProfileInfo,
            hasRequiredInvestmentPrefs,
            profileInfo: user.profileInfo,
            investmentPreferences: user.investmentPreferences,
          });
        }
      }
    }

    console.log("💾 About to save user. Current avatar data:", {
      userId: user._id,
      avatarImageBeforeSave: user.avatarImage,
      hasPublicId: !!user.avatarImage?.public_id,
      hasUrl: !!user.avatarImage?.url,
    });

    await user.save();

    console.log("💾 User profile saved successfully:", {
      userId: user._id,
      avatarImageUrl: user.avatarImage?.url || "No avatar",
      avatarPublicId: user.avatarImage?.public_id || "No public_id",
      fullName: user.fullName,
    });

    // Get updated user without password for security
    const updatedUser = await User.findById(user._id).select("-password");

    console.log("📤 Sending response with user data:", {
      userId: updatedUser?._id,
      avatarInResponse: updatedUser?.avatarImage,
      hasAvatarUrl: !!updatedUser?.avatarImage?.url,
      hasAvatarPublicId: !!updatedUser?.avatarImage?.public_id,
    });

    console.log("✅ Profile update completed successfully");

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    next(createHttpError(500, "Failed to update profile"));
  }
};

const passwordChangeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const _req = req as AuthRequest;
  const userId = _req.userId;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  User.findById(userId)
    .then((user) => {
      if (!user) {
        return next(createHttpError(404, "User not found"));
      }

      bcrypt.compare(currentPassword, user.password).then((isMatched) => {
        if (!isMatched) {
          return next(createHttpError(403, "Current password is incorrect"));
        }
        if (newPassword !== confirmPassword) {
          return next(
            createHttpError(
              403,
              "New password and confirm password do not match"
            )
          );
        }
        if (newPassword === currentPassword) {
          return next(
            createHttpError(
              403,
              "New password cannot be same as current password"
            )
          );
        }
        bcrypt
          .hash(newPassword, 12)
          .then((hashedPassword) => {
            user.password = hashedPassword;
            user
              .save()
              .then(() => {
                res
                  .status(200)
                  .json({ message: "Password changed successfully" });
              })
              .catch((err) => {
                console.log(err);
                return next(
                  createHttpError(500, "Error while saving new password")
                );
              });
          })
          .catch((err) => {
            console.log(err);
            return next(createHttpError(500, "Error whle hashing password"));
          });
      });
    })
    .catch((err) => {
      console.log(err);
      return next(createHttpError(500, "Error finding user"));
    });
};

const userDeletionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _req = req as AuthRequest;
    const userId = _req.userId;
    const { password } = req.body;

    if (!password) {
      return next(
        createHttpError(400, "Password is required to delete account")
      );
    }

    // Find the user first to verify password
    const user = await User.findById(userId);
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    // Verify password before deletion
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(createHttpError(403, "Incorrect password"));
    }

    // Delete the user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (deletedUser) {
      console.log("User deleted successfully:", deletedUser._id);

      // Clear the authentication cookie
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      res.status(200).json({ message: "User deleted successfully" });
    } else {
      return next(createHttpError(404, "User not found"));
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    return next(createHttpError(500, "Error deleting user on server"));
  }
};

const unsubscribeUser = (req: Request, res: Response, next: NextFunction) => {
  const _req = req as AuthRequest;
  const userId = _req.userId;

  User.findByIdAndUpdate(userId, { isUnsubscribed: true }, { new: true })
    .then((user) => {
      if (user) {
        res.status(200).json({ message: "User unsubscribed successfully" });
      } else {
        return next(createHttpError(404, "User not found"));
      }
    })
    .catch((err) => {
      console.log(err);
      return next(createHttpError(500, "Error unsubscribing user on server"));
    });
};

const resubscribeUser = (req: Request, res: Response, next: NextFunction) => {
  const _req = req as AuthRequest;
  const userId = _req.userId;

  User.findByIdAndUpdate(userId, { isUnsubscribed: false }, { new: true })
    .then((user) => {
      if (user) {
        res.status(200).json({ message: "User resubscribed successfully" });
      } else {
        return next(createHttpError(404, "User not found"));
      }
    })
    .catch((err) => {
      console.log(err);
      return next(createHttpError(500, "Error resubscribing user on server"));
    });
};

const logoutUser = (req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.status(200).json({ message: "Logged out successfully" });
};
const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _req = req as AuthRequest;
    const user = await User.findById(_req.userId).select("-password");
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return next(createHttpError(400, "Missing userId or OTP"));
    }

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    // Check if user is already verified
    if (user.isEmailVerified) {
      return res.status(200).json({ message: "Email already verified" });
    }

    // Check if OTP is valid and not expired
    if (
      user.emailVerificationOTP !== otp ||
      !user.emailVerificationOTPExpires ||
      new Date() > new Date(user.emailVerificationOTPExpires)
    ) {
      return next(createHttpError(400, "Invalid or expired verification code"));
    }

    // Mark user as verified and clear OTP fields
    user.isEmailVerified = true;
    user.emailVerificationOTP = "";
    user.emailVerificationOTPExpires = null;

    await user.save();

    // Generate JWT token
    const token = sign(
      { sub: user._id },
      config.JSON_WEB_TOKEN_SECRET as string,
      {
        expiresIn: "3d",
      }
    );

    // Set only the auth token cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "deployment",
      sameSite: "none",
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    });

    res.status(200).json({
      message: "Email verified successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        isAccreditedInvestor: user.isAccreditedInvestor,
        isEmailVerified: user.isEmailVerified,
        isInvestorProfileComplete: user.isInvestorProfileComplete,
      },
    });
  } catch (error) {
    console.log(error);
    return next(createHttpError(500, "Server error during verification"));
  }
};
const resendVerificationOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return next(createHttpError(400, "Missing userId"));
    }

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    // Check if user is already verified
    if (user.isEmailVerified) {
      return res.status(200).json({ message: "Email already verified" });
    }

    // Generate new OTP
    const otp = generateOTP(6);
    const otpExpiry = calculateOTPExpiry(10); // 10 minutes expiry

    // Update user with new OTP
    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpires = otpExpiry;

    await user.save();

    // Send verification email
    await emailService.sendEmailVerificationOTP(user.email, otp, user.fullName);

    res.status(200).json({
      message: "Verification code resent. Check your email.",
    });
  } catch (error) {
    console.error("Error during OTP resend:", error);
    return next(createHttpError(500, "Server error during OTP resend"));
  }
};

// Get featured premium investors
const getFeaturedInvestors = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Fetch premium investors who have completed their profiles and are verified
    const featuredInvestors = await User.find({
      role: "Investor",
      subscriptionPlan: "Investor Access Plan",
      isEmailVerified: true,
      isInvestorProfileComplete: true,
      isUnsubscribed: false,
    })
      .select("-password") // Exclude password field
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(3); // Limit to 4 featured investors for home page

    res.status(200).json({
      message: "Featured investors fetched successfully",
      data: featuredInvestors,
    });
  } catch (error) {
    console.error("Error fetching featured investors:", error);
    next(createHttpError(500, "Error fetching featured investors"));
  }
};

// Get user by ID (for investor profile view)
const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    // Only return public profile information
    // For investors, include their investment preferences and profile info
    res.status(200).json({
      message: "User profile fetched successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    next(createHttpError(500, "Error fetching user profile"));
  }
};

// Get user context (subscription and location) for frontend
const getUserContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _req = req as AuthRequest;
    const userId = _req.userId;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    console.log("🔍 Getting user context for user:", userId);

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    // Get user's subscription plan
    const contextData = {
      subscriptionPlan: user.subscriptionPlan,
      country: user.countryName,
      region: user.countryName,
      role: user.role, // Include user role for access control
    };

    console.log("✅ User context retrieved:", contextData);

    res.status(200).json({
      success: true,
      data: contextData,
    });
  } catch (error) {
    console.error("Error getting user context:", error);
    next(createHttpError(500, "Error fetching user context"));
  }
};

// Debug endpoint to test avatar data
const debugUserAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _req = req as AuthRequest;
    const userId = _req.userId;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    const user = await User.findById(userId).select(
      "avatarImage fullName email"
    );
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    console.log("🔍 Debug avatar data for user:", {
      userId: user._id,
      fullName: user.fullName,
      avatarImage: user.avatarImage,
    });

    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        fullName: user.fullName,
        avatarImage: user.avatarImage,
        hasAvatar: !!user.avatarImage,
        hasUrl: !!user.avatarImage?.url,
        hasPublicId: !!user.avatarImage?.public_id,
      },
    });
  } catch (error) {
    console.error("Error debugging user avatar:", error);
    next(createHttpError(500, "Error debugging user avatar"));
  }
};

export {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  passwordChangeHandler,
  userDeletionHandler,
  unsubscribeUser,
  resubscribeUser,
  logoutUser,
  getCurrentUser,
  verifyEmail,
  resendVerificationOTP,
  getFeaturedInvestors,
  getUserById,
  getUserContext,
  debugUserAvatar,
};
