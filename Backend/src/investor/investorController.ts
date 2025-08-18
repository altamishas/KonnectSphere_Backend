import { NextFunction, Request, Response, RequestHandler } from "express";
import createHttpError from "http-errors";
import { validationResult } from "express-validator";
import User from "../user/userModel";
import { AuthRequest } from "../middlewares/tokenVerification";
import subscriptionAccessControl from "../middlewares/subscriptionAccessControl";

import Pitch from "../pitch/pitchModel";
import { asyncHandler } from "../middlewares/asyncHandler";

// Interface for investor search filters
interface InvestorSearchFilters {
  role: string;
  isEmailVerified: boolean;
  "profileInfo.areasOfExpertise"?: { $in: RegExp[] };
  "investmentPreferences.interestedIndustries"?: { $in: RegExp[] };
  "investmentPreferences.investmentStages"?: { $in: string[] };
  countryName?: { $regex: string; $options: string } | { $in: string[] };
  "investmentPreferences.investmentRangeMin"?: { $lte: number };
  "investmentPreferences.investmentRangeMax"?: { $gte: number };
  $or?: Array<Record<string, unknown>>;
  $and?: Array<Record<string, unknown>>;
}

// Interface for investor profile update data
interface InvestorProfileUpdateData {
  profileInfo?: {
    aboutMe?: string;
    areasOfExpertise?: string[];
    previousInvestments?: number;
    linkedinUrl?: string;
    personalWebsite?: string;
  };
  investmentPreferences?: {
    investmentRangeMin?: number;
    investmentRangeMax?: number;
    interestedIndustries?: string[];
    investmentStages?: string[];
    maxInvestmentsPerYear?: number;
    interestedLocations?: string[];
    pitchCountries?: string[];
    languages?: string[];
    additionalCriteria?: string;
  };
  isInvestorProfileComplete?: boolean;
}

// Get all investors with search and filtering
export const searchInvestors = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = 1,
      limit = 10,
      query: search,
      industries,
      countries,
      stages,
      investmentRangeMin,
      investmentRangeMax,
      sortBy = "createdAt",
    } = req.query;

    const _req = req as AuthRequest;
    const entrepreneurUserId = _req.userId;

    // Build filter object
    const filter: InvestorSearchFilters = {
      role: "Investor",
      isEmailVerified: true,
    };

    // Enhanced text search across multiple fields
    if (search) {
      filter.$or = [
        // Name search
        { fullName: { $regex: search as string, $options: "i" } },
        { bio: { $regex: search as string, $options: "i" } },
        { "profileInfo.aboutMe": { $regex: search as string, $options: "i" } },

        // Industries search
        {
          "investmentPreferences.interestedIndustries": {
            $regex: search as string,
            $options: "i",
          },
        },

        // Areas of expertise search
        {
          "profileInfo.areasOfExpertise": {
            $regex: search as string,
            $options: "i",
          },
        },

        // Languages search
        {
          "investmentPreferences.languages": {
            $regex: search as string,
            $options: "i",
          },
        },

        // Countries search
        { countryName: { $regex: search as string, $options: "i" } },

        // Investment stages search
        {
          "investmentPreferences.investmentStages": {
            $regex: search as string,
            $options: "i",
          },
        },
      ];

      console.log("🔍 Enhanced search applied for:", search);
    }

    // Industry filter (match with investor's interested industries)
    if (industries) {
      const industriesArray = (industries as string).split(",").filter(Boolean);
      if (industriesArray.length > 0) {
        filter["investmentPreferences.interestedIndustries"] = {
          $in: industriesArray.map((industry) => new RegExp(industry, "i")),
        };
      }
    }

    // Country filter (match investor's location)
    if (countries) {
      const countriesArray = (countries as string).split(",").filter(Boolean);
      if (countriesArray.length > 0) {
        filter["countryName"] = {
          $in: countriesArray,
        };
      }
    }

    // Investment stages filter (match with investor's preferred investment stages)
    if (stages) {
      const stagesArray = (stages as string).split(",").filter(Boolean);
      if (stagesArray.length > 0) {
        // OR operation: find investors who are interested in ANY of the selected stages
        filter["investmentPreferences.investmentStages"] = {
          $in: stagesArray,
        };
        console.log("🔍 Investment stages filter applied:", stagesArray);
      }
    }

    // Investment range filter (check if investor's range overlaps with search range)
    if (investmentRangeMin || investmentRangeMax) {
      const minRange = investmentRangeMin
        ? parseInt(investmentRangeMin as string)
        : 0;
      const maxRange = investmentRangeMax
        ? parseInt(investmentRangeMax as string)
        : Number.MAX_SAFE_INTEGER;

      // Find investors whose investment range overlaps with the search range
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          // Investor's min range is within search range
          {
            $and: [
              {
                "investmentPreferences.investmentRangeMin": { $gte: minRange },
              },
              {
                "investmentPreferences.investmentRangeMin": { $lte: maxRange },
              },
            ],
          },
          // Investor's max range is within search range
          {
            $and: [
              {
                "investmentPreferences.investmentRangeMax": { $gte: minRange },
              },
              {
                "investmentPreferences.investmentRangeMax": { $lte: maxRange },
              },
            ],
          },
          // Search range is within investor's range
          {
            $and: [
              {
                "investmentPreferences.investmentRangeMin": { $lte: minRange },
              },
              {
                "investmentPreferences.investmentRangeMax": { $gte: maxRange },
              },
            ],
          },
        ],
      });
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    let sortOptions: Record<string, 1 | -1> = {};
    switch (sortBy) {
      case "investments":
        sortOptions = { "profileInfo.previousInvestments": -1 };
        break;
      case "connections":
        sortOptions = { createdAt: -1 }; // We can add a connections field later
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Execute query
    const allInvestors = await User.find(filter)
      .select(
        "fullName bio countryName cityName avatarImage " +
          "profileInfo investmentPreferences createdAt"
      )
      .sort(sortOptions);

    // Apply subscription-based filtering for entrepreneurs
    let filteredInvestors = allInvestors;

    if (entrepreneurUserId) {
      const entrepreneurUser = await User.findById(entrepreneurUserId);
      const entrepreneurCountry = entrepreneurUser?.countryName;
      const entrepreneurRestrictions =
        await subscriptionAccessControl.getUserSubscriptionRestrictions(
          entrepreneurUserId
        );

      if (entrepreneurRestrictions.investorAccessGlobal) {
        // Premium entrepreneurs can see all investors
        filteredInvestors = allInvestors;
      } else {
        // Basic entrepreneurs can only see investors from their region/country
        filteredInvestors = allInvestors.filter((investor) => {
          const investorCountry = investor.countryName;
          return investorCountry === entrepreneurCountry;
        });
      }
    }

    // Apply pagination after filtering
    const paginatedInvestors = filteredInvestors.slice(skip, skip + limitNum);
    const total = filteredInvestors.length;

    // Transform data for frontend
    const transformedInvestors = paginatedInvestors.map((investor) => ({
      id: investor._id,
      name: investor.fullName,
      title: "Investor", // We can make this dynamic later
      company: investor.profileInfo?.personalWebsite || "Independent Investor",
      avatar: investor.avatarImage?.url || "",
      location:
        `${investor.cityName || ""}, ${investor.countryName || ""}`
          .trim()
          .replace(/^,\s*|,\s*$/g, "") || "Location not specified",
      bio: investor.profileInfo?.aboutMe || investor.bio || "",
      interests:
        investor.profileInfo?.areasOfExpertise?.map(
          (area: string, index: number) => ({
            id: `expertise-${index}`,
            name: area,
          })
        ) || [],
      investmentRange:
        investor.investmentPreferences?.investmentRangeMin &&
        investor.investmentPreferences?.investmentRangeMax
          ? `$${investor.investmentPreferences.investmentRangeMin / 1000}K - $${
              investor.investmentPreferences.investmentRangeMax / 1000000
            }M`
          : "Range not specified",
      pastInvestments: investor.profileInfo?.previousInvestments || 0,
      averageInvestment:
        investor.investmentPreferences?.investmentRangeMin || 0,
      connections: Math.floor(Math.random() * 500) + 50, // Mock data for now
      verified: true,
    }));

    res.status(200).json({
      success: true,
      message: "Investors retrieved successfully",
      data: {
        investors: transformedInvestors,
        pagination: {
          current: pageNum,
          total: Math.ceil(total / limitNum),
          totalItems: total,
        },
      },
    });
  } catch (error) {
    console.error("Error searching investors:", error);
    return next(createHttpError(500, "Failed to search investors"));
  }
};

// Get single investor by ID
export const getInvestorById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const investor = await User.findOne({
      _id: id,
      role: "Investor",
      isEmailVerified: true,
    }).select(
      "fullName bio countryName cityName avatarImage bannerImage " +
        "profileInfo investmentPreferences createdAt"
    );

    if (!investor) {
      return next(createHttpError(404, "Investor not found"));
    }

    // Transform data for frontend
    const transformedInvestor = {
      id: investor._id,
      name: investor.fullName,
      title: "Investor",
      company: investor.profileInfo?.personalWebsite || "Independent Investor",
      avatar: investor.avatarImage?.url || "",
      banner: investor.bannerImage?.url || "",
      location:
        `${investor.cityName || ""}, ${investor.countryName || ""}`
          .trim()
          .replace(/^,\s*|,\s*$/g, "") || "Location not specified",
      bio: investor.bio || "",
      professionalBackground: investor.profileInfo?.aboutMe || "",
      areasOfExpertise: investor.profileInfo?.areasOfExpertise || [],
      investmentRange: {
        min: investor.investmentPreferences?.investmentRangeMin,
        max: investor.investmentPreferences?.investmentRangeMax,
      },
      preferredIndustries:
        investor.investmentPreferences?.interestedIndustries || [],
      pastInvestments: investor.profileInfo?.previousInvestments || 0,
      linkedinUrl: investor.profileInfo?.linkedinUrl || "",
      website: investor.profileInfo?.personalWebsite || "",
      verified: true,
      createdAt: investor.createdAt,
    };

    res.status(200).json({
      success: true,
      message: "Investor details retrieved successfully",
      data: transformedInvestor,
    });
  } catch (error) {
    console.error("Error getting investor:", error);
    return next(createHttpError(500, "Failed to get investor details"));
  }
};

// Update investor profile (only for the investor themselves)
export const updateInvestorProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const userId = req.userId;
    const { profileInfo, investmentPreferences } = req.body;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    // Find the user and check if they are an investor
    const user = await User.findOne({ _id: userId, role: "Investor" });
    if (!user) {
      return next(createHttpError(404, "Investor not found"));
    }

    // Update investor-specific fields
    const updateData: InvestorProfileUpdateData = {};

    if (profileInfo) {
      updateData.profileInfo = {};

      if (profileInfo.aboutMe !== undefined) {
        updateData.profileInfo.aboutMe = profileInfo.aboutMe;
      }
      if (profileInfo.areasOfExpertise !== undefined) {
        updateData.profileInfo.areasOfExpertise = profileInfo.areasOfExpertise;
      }
      if (profileInfo.previousInvestments !== undefined) {
        updateData.profileInfo.previousInvestments = parseInt(
          profileInfo.previousInvestments
        );
      }
      if (profileInfo.linkedinUrl !== undefined) {
        updateData.profileInfo.linkedinUrl = profileInfo.linkedinUrl;
      }
      if (profileInfo.personalWebsite !== undefined) {
        updateData.profileInfo.personalWebsite = profileInfo.personalWebsite;
      }
    }

    if (investmentPreferences) {
      updateData.investmentPreferences = {};

      if (investmentPreferences.investmentRangeMin !== undefined) {
        updateData.investmentPreferences.investmentRangeMin = parseInt(
          investmentPreferences.investmentRangeMin
        );
      }
      if (investmentPreferences.investmentRangeMax !== undefined) {
        updateData.investmentPreferences.investmentRangeMax = parseInt(
          investmentPreferences.investmentRangeMax
        );
      }
      if (investmentPreferences.interestedIndustries !== undefined) {
        updateData.investmentPreferences.interestedIndustries =
          investmentPreferences.interestedIndustries;
      }
      if (investmentPreferences.investmentStages !== undefined) {
        updateData.investmentPreferences.investmentStages =
          investmentPreferences.investmentStages;
      }
      if (investmentPreferences.maxInvestmentsPerYear !== undefined) {
        updateData.investmentPreferences.maxInvestmentsPerYear = parseInt(
          investmentPreferences.maxInvestmentsPerYear
        );
      }
      if (investmentPreferences.interestedLocations !== undefined) {
        updateData.investmentPreferences.interestedLocations =
          investmentPreferences.interestedLocations;
      }
      if (investmentPreferences.pitchCountries !== undefined) {
        updateData.investmentPreferences.pitchCountries =
          investmentPreferences.pitchCountries;
      }
      if (investmentPreferences.languages !== undefined) {
        updateData.investmentPreferences.languages =
          investmentPreferences.languages;
      }
      if (investmentPreferences.additionalCriteria !== undefined) {
        updateData.investmentPreferences.additionalCriteria =
          investmentPreferences.additionalCriteria;
      }
    }

    // Mark investor profile as complete if about me is provided
    if (profileInfo && profileInfo.aboutMe !== undefined) {
      updateData.isInvestorProfileComplete = true;
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select(
      "fullName bio countryName cityName " +
        "profileInfo investmentPreferences isInvestorProfileComplete"
    );

    res.status(200).json({
      success: true,
      message: "Investor profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating investor profile:", error);
    return next(createHttpError(500, "Failed to update investor profile"));
  }
};

// Star/Unstar investor (for entrepreneurs)
export const toggleStarInvestor = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { investorId } = req.params;
    const { action } = req.body; // 'star' or 'unstar'

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    // Verify investor exists
    const investor = await User.findOne({
      _id: investorId,
      role: "Investor",
    });

    if (!investor) {
      return next(createHttpError(404, "Investor not found"));
    }

    // For now, we'll just return success
    // In a real implementation, you'd store starred investors in a separate collection
    // or add a starredInvestors array to the user model

    res.status(200).json({
      success: true,
      message: `Investor ${
        action === "star" ? "starred" : "unstarred"
      } successfully`,
    });
  } catch (error) {
    console.error("Error toggling star:", error);
    return next(createHttpError(500, "Failed to update starred status"));
  }
};

// Connect with investor
export const connectWithInvestor = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { investorId } = req.params;
    const { message } = req.body;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    // Verify both users exist
    const [entrepreneur, investor] = await Promise.all([
      User.findOne({ _id: userId, role: "Entrepreneur" }),
      User.findOne({ _id: investorId, role: "Investor" }),
    ]);

    if (!entrepreneur) {
      return next(createHttpError(404, "Entrepreneur not found"));
    }

    if (!investor) {
      return next(createHttpError(404, "Investor not found"));
    }

    // In a real implementation, you'd:
    // 1. Create a connection request record
    // 2. Send notification to investor
    // 3. Send email notification

    res.status(200).json({
      success: true,
      message: "Connection request sent successfully",
      data: {
        entrepreneurName: entrepreneur.fullName,
        investorName: investor.fullName,
        message: message || "No message provided",
      },
    });
  } catch (error) {
    console.error("Error connecting with investor:", error);
    return next(createHttpError(500, "Failed to send connection request"));
  }
};

// Send message to investor
export const sendMessageToInvestor = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { investorId } = req.params;
    const { message } = req.body;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    if (!message || message.trim().length === 0) {
      return next(createHttpError(400, "Message content is required"));
    }

    // Verify both users exist
    const [entrepreneur, investor] = await Promise.all([
      User.findOne({ _id: userId, role: "Entrepreneur" }),
      User.findOne({ _id: investorId, role: "Investor" }),
    ]);

    if (!entrepreneur) {
      return next(createHttpError(404, "Entrepreneur not found"));
    }

    if (!investor) {
      return next(createHttpError(404, "Investor not found"));
    }

    // In a real implementation, you'd:
    // 1. Create a message record in a messages collection
    // 2. Send notification to investor
    // 3. Send email notification if investor has email notifications enabled

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
      data: {
        from: entrepreneur.fullName,
        to: investor.fullName,
        message: message.trim(),
        sentAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return next(createHttpError(500, "Failed to send message"));
  }
};

// Test endpoint for investor filtering functionality
export const testInvestorFiltering = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("🧪 Testing investor filtering functionality...");
    console.log("🔍 Received query parameters:", req.query);

    const {
      countries,
      industries,
      stages,
      investmentRangeMin,
      investmentRangeMax,
    } = req.query;

    // Test each filter type
    const testResults: Record<string, unknown> = {};

    // Test country filtering
    if (countries) {
      const countryList = (countries as string).split(",").filter(Boolean);
      const countryMatches = await User.find({
        role: "Investor",
        isEmailVerified: true,
        countryName: { $in: countryList },
      }).select("fullName countryName investmentPreferences");

      testResults.countries = {
        requested: countryList,
        matches: countryMatches.length,
        sampleMatches: countryMatches.slice(0, 3).map((u) => ({
          name: u.fullName,
          country: u.countryName,
          interestedIndustries:
            u.investmentPreferences?.interestedIndustries || [],
        })),
      };
    }

    // Test industry filtering
    if (industries) {
      const industryList = (industries as string).split(",").filter(Boolean);
      const industryMatches = await User.find({
        role: "Investor",
        isEmailVerified: true,
        "investmentPreferences.interestedIndustries": {
          $in: industryList.map((industry) => new RegExp(industry, "i")),
        },
      }).select("fullName investmentPreferences");

      testResults.industries = {
        requested: industryList,
        matches: industryMatches.length,
        sampleMatches: industryMatches.slice(0, 3).map((u) => ({
          name: u.fullName,
          interestedIndustries:
            u.investmentPreferences?.interestedIndustries || [],
        })),
      };
    }

    // Test investment stages filtering
    if (stages) {
      const stagesList = (stages as string).split(",").filter(Boolean);
      const stageMatches = await User.find({
        role: "Investor",
        isEmailVerified: true,
        "investmentPreferences.investmentStages": {
          $in: stagesList,
        },
      }).select("fullName investmentPreferences");

      testResults.investmentStages = {
        requested: stagesList,
        matches: stageMatches.length,
        sampleMatches: stageMatches.slice(0, 3).map((u) => ({
          name: u.fullName,
          investmentStages: u.investmentPreferences?.investmentStages || [],
        })),
      };
    }

    // Test investment range filtering
    if (investmentRangeMin || investmentRangeMax) {
      const minRange = investmentRangeMin
        ? parseInt(investmentRangeMin as string)
        : 0;
      const maxRange = investmentRangeMax
        ? parseInt(investmentRangeMax as string)
        : Number.MAX_SAFE_INTEGER;

      const rangeMatches = await User.find({
        role: "Investor",
        isEmailVerified: true,
        $or: [
          {
            $and: [
              {
                "investmentPreferences.investmentRangeMin": { $gte: minRange },
              },
              {
                "investmentPreferences.investmentRangeMin": { $lte: maxRange },
              },
            ],
          },
          {
            $and: [
              {
                "investmentPreferences.investmentRangeMax": { $gte: minRange },
              },
              {
                "investmentPreferences.investmentRangeMax": { $lte: maxRange },
              },
            ],
          },
          {
            $and: [
              {
                "investmentPreferences.investmentRangeMin": { $lte: minRange },
              },
              {
                "investmentPreferences.investmentRangeMax": { $gte: maxRange },
              },
            ],
          },
        ],
      }).select("fullName investmentPreferences");

      testResults.investmentRange = {
        requestedMin: minRange,
        requestedMax: maxRange,
        matches: rangeMatches.length,
        sampleMatches: rangeMatches.slice(0, 3).map((u) => ({
          name: u.fullName,
          rangeMin: u.investmentPreferences?.investmentRangeMin,
          rangeMax: u.investmentPreferences?.investmentRangeMax,
        })),
      };
    }

    // Get sample data for understanding
    const allInvestors = await User.find({
      role: "Investor",
      isEmailVerified: true,
    })
      .select("fullName countryName investmentPreferences")
      .limit(10);

    const sampleData = {
      totalInvestors: await User.countDocuments({
        role: "Investor",
        isEmailVerified: true,
      }),
      availableCountries: [
        ...new Set(allInvestors.map((u) => u.countryName).filter(Boolean)),
      ],
      availableIndustries: [
        ...new Set(
          allInvestors
            .map((u) => u.investmentPreferences?.interestedIndustries || [])
            .flat()
            .filter(Boolean)
        ),
      ],
      sampleInvestors: allInvestors.slice(0, 5).map((u) => ({
        name: u.fullName,
        country: u.countryName,
        interestedIndustries:
          u.investmentPreferences?.interestedIndustries || [],
        rangeMin: u.investmentPreferences?.investmentRangeMin,
        rangeMax: u.investmentPreferences?.investmentRangeMax,
      })),
    };

    res.status(200).json({
      success: true,
      message: "Investor filter testing completed",
      data: {
        requestedFilters: req.query,
        testResults,
        sampleData,
      },
    });
  } catch (error) {
    console.error("Error testing investor filtering:", error);
    return next(createHttpError(500, "Failed to test investor filtering"));
  }
};

export const getPreferredPitches: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Get investor's preferences
    const investor = await User.findById(userId).select(
      "investmentPreferences"
    );
    if (!investor || !investor.investmentPreferences) {
      return res.status(404).json({
        success: false,
        message:
          "Investor preferences not found. Please set your preferences in the account settings.",
      });
    }

    const preferences = investor.investmentPreferences as {
      investmentRangeMin?: number;
      investmentRangeMax?: number;
      interestedIndustries?: string[];
      pitchCountries?: string[];
    };

    console.log("🔍 Investor preferences:", preferences);

    // Build query based on preferences
    const query: Record<string, unknown> = {
      status: "published", // Only show published pitches
      isActive: true, // Only active pitches
    };

    // Filter by countries if specified
    if (preferences.pitchCountries && preferences.pitchCountries.length > 0) {
      query["companyInfo.country"] = {
        $in: preferences.pitchCountries,
      };
    }

    // Filter by industries if specified - Use more flexible matching
    if (
      preferences.interestedIndustries &&
      preferences.interestedIndustries.length > 0
    ) {
      // Build OR conditions for industry matching
      const industryConditions = [];

      // Match industry1
      industryConditions.push({
        "companyInfo.industry1": { $in: preferences.interestedIndustries },
      });

      // Match industry2 (if exists)
      industryConditions.push({
        "companyInfo.industry2": { $in: preferences.interestedIndustries },
      });

      query["$or"] = industryConditions;
    }

    console.log("🔍 MongoDB query:", JSON.stringify(query, null, 2));

    // First, let's check total published pitches for debugging
    const totalPublishedPitches = await Pitch.countDocuments({
      status: "published",
      isActive: true,
    });
    console.log(
      "🔍 Total published pitches in database:",
      totalPublishedPitches
    );

    // Get pitches without pagination first (for filtering), then apply pagination to final results
    const pitches = await Pitch.find(query)
      .populate("userId", "fullName email avatarImage")
      .sort({
        "package.selectedPackage": -1, // Premium pitches first
        createdAt: -1, // Then by newest
      });

    console.log("🔍 Pitches found with query:", pitches.length);

    // Log sample pitch data for debugging
    if (pitches.length > 0) {
      console.log("🔍 Sample pitch data:", {
        id: pitches[0]._id,
        title: pitches[0].companyInfo?.pitchTitle,
        country: pitches[0].companyInfo?.country,
        industry1: pitches[0].companyInfo?.industry1,
        industry2: pitches[0].companyInfo?.industry2,
        minimumInvestment: pitches[0].companyInfo?.minimumInvestment,
        raisingAmount: pitches[0].companyInfo?.raisingAmount,
        status: pitches[0].status,
        isActive: pitches[0].isActive,
      });
    }

    // Transform pitches data and apply investment range filtering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedPitches = pitches.map((pitch: any) => {
      // Parse minimum investment from string to number for comparison
      const minimumInvestment = parseInt(
        pitch.companyInfo?.minimumInvestment?.replace(/[^\d]/g, "") || "0"
      );

      // Parse raising amount (total funding goal)
      const raisingAmount = parseInt(
        pitch.companyInfo?.raisingAmount?.replace(/[^\d]/g, "") || "0"
      );

      // Check if pitch matches investment range
      // Investor can invest if their minimum range >= pitch's minimum investment
      // and pitch's minimum investment <= investor's maximum range
      const matchesRange =
        !preferences.investmentRangeMin ||
        !preferences.investmentRangeMax ||
        minimumInvestment === 0 || // If no minimum investment set, include the pitch
        (minimumInvestment <= preferences.investmentRangeMax &&
          minimumInvestment >= 1); // Minimum investment should be reasonable

      console.log("🔍 Range check for pitch:", {
        pitchTitle: pitch.companyInfo?.pitchTitle,
        minimumInvestment,
        investorRangeMin: preferences.investmentRangeMin,
        investorRangeMax: preferences.investmentRangeMax,
        matchesRange,
      });

      return {
        id: pitch._id,
        title: pitch.companyInfo?.pitchTitle || "Untitled Pitch",
        description: pitch.pitchDeal?.summary || "",
        industry: pitch.companyInfo?.industry1 || "Other",
        fundingGoal: raisingAmount,
        fundingRaised: parseInt(
          pitch.companyInfo?.raisedSoFar?.replace(/[^\d]/g, "") || "0"
        ),
        stage: pitch.companyInfo?.stage || "Pre-Seed",
        country: pitch.companyInfo?.country || "",
        entrepreneur: {
          name: pitch.userId?.fullName || "",
          avatar: pitch.userId?.avatarImage?.url || "",
          company: "", // Not stored in pitch model
        },
        isPremium: pitch.package?.selectedPackage === "Premium",
        createdAt: pitch.createdAt,
        media: pitch.media || {},
        minimumInvestment,
        _matchesInvestmentRange: matchesRange,
      };
    });

    // Filter by investment range after transformation
    const allFilteredPitches = transformedPitches
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((pitch: any) => pitch._matchesInvestmentRange)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ _matchesInvestmentRange, ...pitch }) => pitch);

    console.log("🔍 All filtered pitches:", allFilteredPitches.length);

    // Apply pagination to filtered results
    const paginatedPitches = allFilteredPitches.slice(skip, skip + limit);
    console.log("🔍 Paginated pitches:", paginatedPitches.length);

    res.status(200).json({
      success: true,
      data: paginatedPitches,
      pagination: {
        page,
        limit,
        total: allFilteredPitches.length,
        totalPages: Math.ceil(allFilteredPitches.length / limit),
      },
      meta: {
        preferences: {
          investmentRange:
            preferences.investmentRangeMin && preferences.investmentRangeMax
              ? `$${preferences.investmentRangeMin.toLocaleString()} - $${preferences.investmentRangeMax.toLocaleString()}`
              : "Not specified",
          industries:
            preferences.interestedIndustries?.join(", ") || "Not specified",
          countries: preferences.pitchCountries?.join(", ") || "Not specified",
        },
      },
    });
  }
);
