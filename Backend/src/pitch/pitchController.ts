// Updated after removing language filter
import { Request, Response, NextFunction } from "express";
import { default as PitchModel } from "./pitchModel";
import type { Model } from "mongoose";

interface UserPopulated {
  _id: string;
  fullName: string;
  email: string;
  avatarImage?: {
    url?: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PitchDocument = ReturnType<Model<any>["hydrate"]>;

// Public featured pitches for homepage (no auth required)
export const getPublicFeaturedPitches = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type = "trending" } = req.query;

    // Base query for published and active pitches
    const baseQuery = {
      status: "published",
      isActive: true,
    };

    // Get pitches with pagination
    const pitches = await PitchModel.find(baseQuery)
      .populate<{ userId: UserPopulated }>(
        "userId",
        "fullName email avatarImage"
      )
      .sort({
        "package.selectedPackage": -1, // Premium pitches first
        createdAt: type === "newest" ? -1 : 1, // For newest, show latest first
      })
      .limit(6); // Limit to 6 pitches for homepage

    // Transform pitches for frontend to match PitchCard props
    const transformedPitches = pitches.map((pitch: PitchDocument) => ({
      _id: pitch._id,
      companyInfo: {
        pitchTitle: pitch.companyInfo?.pitchTitle || "Untitled Pitch",
        industry1: pitch.companyInfo?.industry1 || "General",
        raisingAmount: pitch.companyInfo?.raisingAmount || "0",
        raisedSoFar: pitch.companyInfo?.raisedSoFar || "0",
      },
      pitchDeal: {
        summary: pitch.pitchDeal?.summary || "No description available",
      },
      media: {
        banner: pitch.media?.banner || null,
        logo: pitch.media?.logo || null,
      },
      package: {
        selectedPackage: pitch.package?.selectedPackage || "Basic",
      },
      userId: {
        fullName: pitch.userId?.fullName || "",
        avatarImage: pitch.userId?.avatarImage || null,
      },
      createdAt: pitch.createdAt,
      updatedAt: pitch.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: transformedPitches,
    });
  } catch (error) {
    console.error("Error fetching public featured pitches:", error);
    next(error);
  }
};
import Pitch from "./pitchModel";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinaryMethods";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import fs from "fs";
import { UserSubscription } from "../subscription/subscriptionModel";
import User from "../user/userModel";

// Helper function to check if entrepreneur can publish pitches
const checkEntrepreneurPublishingRights = async (
  userId: string
): Promise<{ canPublish: boolean; reason?: string }> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { canPublish: false, reason: "User not found" };
    }

    if (user.role !== "Entrepreneur") {
      return { canPublish: true }; // Investors don't publish pitches
    }

    // Check if entrepreneur has an active subscription
    const userSubscription = await UserSubscription.findOne({
      user: userId,
      active: true,
      status: { $in: ["active", "trialing"] },
    }).populate("subscription");

    if (!userSubscription) {
      return {
        canPublish: false,
        reason:
          "Entrepreneurs need to purchase a subscription plan (Basic or Premium) to publish pitches",
      };
    }

    return { canPublish: true };
  } catch (error) {
    console.error("Error checking entrepreneur publishing rights:", error);
    return { canPublish: false, reason: "Error checking subscription status" };
  }
};

// Interface for authenticated request
interface AuthRequest extends Request {
  userId?: string;
}

// Interface for User document with subscription info
interface UserDocument {
  _id: string;
  fullName: string;
  avatarImage?: string;
  email: string;
  phoneNumber?: string;
  role: "entrepreneur" | "investor";
  subscriptionPlan:
    | "basic"
    | "Basic"
    | "premium"
    | "Premium"
    | "Investor Access Plan";
  countryName: string;
  isUnsubscribed?: boolean;
}

// Interface for populated pitch document
interface PopulatedPitchDocument {
  _id: string;
  userId: UserDocument;
  companyInfo?: {
    pitchTitle: string;
    country: string;
    industry1: string;
    stage: string;
    raisingAmount: number;
    minimumInvestment: number;
    [key: string]: unknown;
  };
  pitchDeal?: {
    summary: string;
    business: string;
    market: string;
    [key: string]: unknown;
  };
  media?: {
    logo?: { public_id: string; url: string };
    banner?: { public_id: string; url: string };
    youtubeUrl?: string;
    uploadedVideo?: { public_id: string; url: string };
    images: { public_id: string; url: string }[];
    [key: string]: unknown;
  };
  status: "draft" | "published";
  isActive: boolean;
  publishedAt?: Date;
  createdAt: Date;
  [key: string]: unknown;
}

// Interface for team member
interface TeamMember {
  name: string;
  role: string;
  bio: string;
  linkedinUrl?: string;
  profileImage?: {
    public_id: string;
    url: string;
  };
  experience: string;
  skills: string[];
}

// Interface for pitch update data
interface PitchUpdateData {
  updatedAt: Date;
  companyInfo?: Record<string, unknown>;
  pitchDeal?: Record<string, unknown>;
  team?: Record<string, unknown>;
  media?: Record<string, unknown>;
  documents?: Record<string, unknown>;
  package?: Record<string, unknown>;
}

// Interface for MongoDB query
interface MongoQuery {
  status: string;
  isActive: boolean;
  $or?: Array<Record<string, unknown>>;
  $and?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

// Interface for sort stage
interface SortStage {
  subscriptionPriority?: number;
  publishedAt?: number;
  createdAt?: number;
}

// Interface for test results
interface TestResults {
  countries?: {
    requested: string[];
    matches: number;
    sampleMatches: Array<{
      title: string;
      country: string;
      userPlan: string;
    }>;
  };
  industries?: {
    requested: string[];
    matches: number;
    sampleMatches: Array<{
      title: string;
      industry: string;
      userPlan: string;
    }>;
  };
  stages?: {
    requested: string[];
    matches: number;
    sampleMatches: Array<{
      title: string;
      stage: string;
      userPlan: string;
    }>;
  };
}

// Helper function to upload file to Cloudinary and return proper format
const uploadFileToCloudinary = async (
  file: Express.Multer.File,
  folderName: string,
  resourceType: "image" | "video" | "raw"
) => {
  try {
    const result = await uploadToCloudinary(
      file.path,
      folderName,
      resourceType
    );

    // Clean up temporary file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return {
      public_id: result.public_id,
      url: result.secure_url,
      originalName: file.originalname,
    };
  } catch (error) {
    // Clean up temporary file even if upload fails
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
};

// Helper function to handle multiple file uploads
const uploadMultipleFiles = async (
  files: Express.Multer.File[],
  folderName: string,
  resourceType: "image" | "video" | "raw"
) => {
  const uploadPromises = files.map((file) =>
    uploadFileToCloudinary(file, folderName, resourceType)
  );
  return await Promise.all(uploadPromises);
};

// Get or create pitch draft for user
const getPitchDraft = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    // Find existing draft
    const pitch = await Pitch.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: "draft",
    });

    // Only return existing draft, don't create empty draft
    if (pitch) {
      res.status(200).json({
        success: true,
        message: "Pitch draft retrieved successfully",
        data: pitch,
      });
    } else {
      // Return empty response - draft will be created when user actually starts entering data
      res.status(200).json({
        success: true,
        message: "No draft found",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error getting pitch draft:", error);
    return next(createHttpError(500, "Failed to get pitch draft"));
  }
};

// Update company info step
const updateCompanyInfo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const companyInfoData = req.body;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    // Validation
    const requiredFields = [
      "pitchTitle",
      "website",
      "country",
      "phoneNumber",
      "industry1",
      "stage",
      "idealInvestorRole",
      "raisingAmount",
      "minimumInvestment",
    ];
    const missingFields = requiredFields.filter(
      (field) => !companyInfoData[field]
    );

    if (missingFields.length > 0) {
      return next(
        createHttpError(
          400,
          `Missing required fields: ${missingFields.join(", ")}`
        )
      );
    }

    // Only allow editing if pitch is in draft status
    const pitch = await Pitch.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        status: "draft", // Only allow editing drafts
      },
      {
        $set: {
          companyInfo: companyInfoData,
          updatedAt: new Date(),
        },
        $addToSet: {
          completedSteps: "company-info",
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    if (!pitch) {
      return next(createHttpError(403, "Can only edit draft pitches"));
    }

    res.status(200).json({
      success: true,
      message: "Company information saved successfully",
      data: {
        companyInfo: pitch?.companyInfo,
        completedSteps: pitch?.completedSteps,
      },
    });
  } catch (error) {
    console.error("Error updating company info:", error);
    return next(createHttpError(500, "Failed to update company information"));
  }
};

// Update pitch deal step
const updatePitchDeal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const pitchDealData = req.body;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    // Validation
    const requiredFields = [
      "summary",
      "business",
      "market",
      "progress",
      "objectives",
      "highlights",
      "dealType",
      "financials",
      "tags",
    ];
    const missingFields = requiredFields.filter(
      (field) => !pitchDealData[field]
    );

    if (missingFields.length > 0) {
      return next(
        createHttpError(
          400,
          `Missing required fields: ${missingFields.join(", ")}`
        )
      );
    }

    const pitch = await Pitch.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        status: "draft", // Only allow editing drafts
      },
      {
        $set: {
          pitchDeal: pitchDealData,
          updatedAt: new Date(),
        },
        $addToSet: {
          completedSteps: "pitch-deal",
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    if (!pitch) {
      return next(createHttpError(403, "Can only edit draft pitches"));
    }

    res.status(200).json({
      success: true,
      message: "Pitch deal information saved successfully",
      data: {
        pitchDeal: pitch?.pitchDeal,
        completedSteps: pitch?.completedSteps,
      },
    });
  } catch (error) {
    console.error("Error updating pitch deal:", error);
    return next(
      createHttpError(500, "Failed to update pitch deal information")
    );
  }
};

// Update team step with proper file upload handling
const updateTeam = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const teamData = req.body;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    // Parse members data - it could be JSON string when sent with files
    let members: TeamMember[] = [];
    if (typeof teamData.members === "string") {
      try {
        members = JSON.parse(teamData.members);
      } catch (error) {
        console.error("Error parsing members JSON:", error);
        return next(createHttpError(400, "Invalid members data format"));
      }
    } else if (Array.isArray(teamData.members)) {
      members = teamData.members;
    } else {
      return next(createHttpError(400, "Members data is required"));
    }

    // Handle profile image uploads for team members
    const processedMembers = await Promise.all(
      members.map(async (member: TeamMember, index: number) => {
        // Check if member has a profile image file to upload
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        const profileImageFile = files?.[`profileImage_${index}`]?.[0];

        if (profileImageFile) {
          // Delete old profile image if exists
          if (member.profileImage?.public_id) {
            try {
              await deleteFromCloudinary(
                member.profileImage.public_id,
                "image"
              );
            } catch (error) {
              console.error("Error deleting old profile image:", error);
            }
          }

          // Upload new profile image
          const uploadResult = await uploadFileToCloudinary(
            profileImageFile,
            `pitches/${userId}/team/profile-images`,
            "image"
          );

          return {
            ...member,
            profileImage: {
              public_id: uploadResult.public_id,
              url: uploadResult.url,
            },
          };
        }

        return member;
      })
    );

    const pitch = await Pitch.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        status: "draft", // Only allow editing drafts
      },
      {
        $set: {
          "team.members": processedMembers,
          updatedAt: new Date(),
        },
        $addToSet: {
          completedSteps: "team",
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    if (!pitch) {
      return next(createHttpError(403, "Can only edit draft pitches"));
    }

    res.status(200).json({
      success: true,
      message: "Team information saved successfully",
      data: {
        team: pitch?.team,
        completedSteps: pitch?.completedSteps,
      },
    });
  } catch (error) {
    console.error("Error updating team:", error);
    return next(createHttpError(500, "Failed to update team information"));
  }
};

// Update media step with proper file upload handling
const updateMedia = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const mediaData = req.body;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const mediaUpdate: {
      videoType: string;
      youtubeUrl?: string;
      logo?: { public_id: string; url: string };
      banner?: { public_id: string; url: string };
      images: { public_id: string; url: string }[];
      uploadedVideo?: { public_id: string; url: string };
    } = {
      videoType: mediaData.videoType || "youtube",
      youtubeUrl: mediaData.youtubeUrl,
      images: [],
    };

    // Handle logo upload
    if (files?.logo?.[0]) {
      // Delete old logo if exists
      if (mediaData.currentLogo?.public_id) {
        try {
          await deleteFromCloudinary(mediaData.currentLogo.public_id, "image");
        } catch (error) {
          console.error("Error deleting old logo:", error);
        }
      }

      const logoResult = await uploadFileToCloudinary(
        files.logo[0],
        `pitches/${userId}/media/logo`,
        "image"
      );

      mediaUpdate.logo = {
        public_id: logoResult.public_id,
        url: logoResult.url,
      };
    } else if (mediaData.logo) {
      mediaUpdate.logo = mediaData.logo;
    }

    // Handle banner upload
    if (files?.banner?.[0]) {
      // Delete old banner if exists
      if (mediaData.currentBanner?.public_id) {
        try {
          await deleteFromCloudinary(
            mediaData.currentBanner.public_id,
            "image"
          );
        } catch (error) {
          console.error("Error deleting old banner:", error);
        }
      }

      const bannerResult = await uploadFileToCloudinary(
        files.banner[0],
        `pitches/${userId}/media/banner`,
        "image"
      );

      mediaUpdate.banner = {
        public_id: bannerResult.public_id,
        url: bannerResult.url,
      };
    } else if (mediaData.banner) {
      mediaUpdate.banner = mediaData.banner;
    }

    // Handle gallery images upload
    if (files?.images && files.images.length > 0) {
      const imageResults = await uploadMultipleFiles(
        files.images,
        `pitches/${userId}/media/gallery`,
        "image"
      );

      mediaUpdate.images = imageResults.map((result) => ({
        public_id: result.public_id,
        url: result.url,
      }));
    } else if (mediaData.images) {
      mediaUpdate.images = mediaData.images;
    }

    // Handle uploaded video
    if (files?.uploadedVideo?.[0]) {
      // Delete old video if exists
      if (mediaData.currentUploadedVideo?.public_id) {
        try {
          await deleteFromCloudinary(
            mediaData.currentUploadedVideo.public_id,
            "video"
          );
        } catch (error) {
          console.error("Error deleting old video:", error);
        }
      }

      const videoResult = await uploadFileToCloudinary(
        files.uploadedVideo[0],
        `pitches/${userId}/media/video`,
        "video"
      );

      mediaUpdate.uploadedVideo = {
        public_id: videoResult.public_id,
        url: videoResult.url,
      };
    } else if (mediaData.uploadedVideo) {
      mediaUpdate.uploadedVideo = mediaData.uploadedVideo;
    }

    const pitch = await Pitch.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        status: "draft", // Only allow editing drafts
      },
      {
        $set: {
          media: mediaUpdate,
          updatedAt: new Date(),
        },
        $addToSet: {
          completedSteps: "media",
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    if (!pitch) {
      return next(createHttpError(403, "Can only edit draft pitches"));
    }

    res.status(200).json({
      success: true,
      message: "Media information saved successfully",
      data: {
        media: pitch?.media,
        completedSteps: pitch?.completedSteps,
      },
    });
  } catch (error) {
    console.error("Error updating media:", error);
    return next(createHttpError(500, "Failed to update media information"));
  }
};

// Update documents step with proper file upload handling
const updateDocuments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const documentsData = req.body;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const documentsUpdate: {
      additionalDocuments: {
        public_id: string;
        url: string;
        originalName: string;
      }[];
      businessPlan?: { public_id: string; url: string; originalName: string };
      financials?: { public_id: string; url: string; originalName: string };
      pitchDeck?: { public_id: string; url: string; originalName: string };
      executiveSummary?: {
        public_id: string;
        url: string;
        originalName: string;
      };
    } = {
      additionalDocuments: documentsData.additionalDocuments || [],
    };

    // Handle business plan upload
    if (files?.businessPlan?.[0]) {
      // Delete old document if exists
      if (documentsData.currentBusinessPlan?.public_id) {
        try {
          await deleteFromCloudinary(
            documentsData.currentBusinessPlan.public_id,
            "raw"
          );
        } catch (error) {
          console.error("Error deleting old business plan:", error);
        }
      }

      const result = await uploadFileToCloudinary(
        files.businessPlan[0],
        `pitches/${userId}/documents`,
        "raw"
      );

      documentsUpdate.businessPlan = {
        public_id: result.public_id,
        url: result.url,
        originalName: result.originalName,
      };
    } else if (documentsData.businessPlan) {
      documentsUpdate.businessPlan = documentsData.businessPlan;
    }

    // Handle financials upload
    if (files?.financials?.[0]) {
      // Delete old document if exists
      if (documentsData.currentFinancials?.public_id) {
        try {
          await deleteFromCloudinary(
            documentsData.currentFinancials.public_id,
            "raw"
          );
        } catch (error) {
          console.error("Error deleting old financials:", error);
        }
      }

      const result = await uploadFileToCloudinary(
        files.financials[0],
        `pitches/${userId}/documents`,
        "raw"
      );

      documentsUpdate.financials = {
        public_id: result.public_id,
        url: result.url,
        originalName: result.originalName,
      };
    } else if (documentsData.financials) {
      documentsUpdate.financials = documentsData.financials;
    }

    // Handle pitch deck upload
    if (files?.pitchDeck?.[0]) {
      // Delete old document if exists
      if (documentsData.currentPitchDeck?.public_id) {
        try {
          await deleteFromCloudinary(
            documentsData.currentPitchDeck.public_id,
            "raw"
          );
        } catch (error) {
          console.error("Error deleting old pitch deck:", error);
        }
      }

      const result = await uploadFileToCloudinary(
        files.pitchDeck[0],
        `pitches/${userId}/documents`,
        "raw"
      );

      documentsUpdate.pitchDeck = {
        public_id: result.public_id,
        url: result.url,
        originalName: result.originalName,
      };
    } else if (documentsData.pitchDeck) {
      documentsUpdate.pitchDeck = documentsData.pitchDeck;
    }

    // Handle executive summary upload
    if (files?.executiveSummary?.[0]) {
      // Delete old document if exists
      if (documentsData.currentExecutiveSummary?.public_id) {
        try {
          await deleteFromCloudinary(
            documentsData.currentExecutiveSummary.public_id,
            "raw"
          );
        } catch (error) {
          console.error("Error deleting old executive summary:", error);
        }
      }

      const result = await uploadFileToCloudinary(
        files.executiveSummary[0],
        `pitches/${userId}/documents`,
        "raw"
      );

      documentsUpdate.executiveSummary = {
        public_id: result.public_id,
        url: result.url,
        originalName: result.originalName,
      };
    } else if (documentsData.executiveSummary) {
      documentsUpdate.executiveSummary = documentsData.executiveSummary;
    }

    // Handle additional documents upload
    if (files?.additionalDocuments && files.additionalDocuments.length > 0) {
      const additionalResults = await uploadMultipleFiles(
        files.additionalDocuments,
        `pitches/${userId}/documents/additional`,
        "raw"
      );

      documentsUpdate.additionalDocuments = additionalResults.map((result) => ({
        public_id: result.public_id,
        url: result.url,
        originalName: result.originalName,
      }));
    }

    const pitch = await Pitch.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        status: "draft", // Only allow editing drafts
      },
      {
        $set: {
          documents: documentsUpdate,
          updatedAt: new Date(),
        },
        $addToSet: {
          completedSteps: "documents",
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    if (!pitch) {
      return next(createHttpError(403, "Can only edit draft pitches"));
    }

    res.status(200).json({
      success: true,
      message: "Documents information saved successfully",
      data: {
        documents: pitch?.documents,
        completedSteps: pitch?.completedSteps,
      },
    });
  } catch (error) {
    console.error("Error updating documents:", error);
    return next(createHttpError(500, "Failed to update documents information"));
  }
};

// Update package step and publish pitch
const updatePackage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const packageData = req.body;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    // Check if entrepreneur can publish pitches
    const publishingRights = await checkEntrepreneurPublishingRights(userId);
    if (!publishingRights.canPublish) {
      return next(
        createHttpError(403, publishingRights.reason || "Cannot publish pitch")
      );
    }

    // Validation
    if (!packageData.selectedPackage || !packageData.agreeToTerms) {
      return next(
        createHttpError(
          400,
          "Package selection and terms agreement are required"
        )
      );
    }

    // Find draft pitch only
    const pitch = await Pitch.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: "draft",
    }).sort({ updatedAt: -1 }); // Get the most recent draft

    if (!pitch) {
      return next(createHttpError(404, "No draft pitch found to publish"));
    }

    // Validate that the pitch has meaningful content before publishing
    if (!hasMeaningfulContent(pitch)) {
      return next(
        createHttpError(
          400,
          "Cannot publish an empty pitch. Please add content first."
        )
      );
    }

    // Publish the pitch (convert draft to published directly)
    const updatedPitch = await Pitch.findByIdAndUpdate(
      pitch._id,
      {
        $set: {
          package: {
            selectedPackage: packageData.selectedPackage,
            agreeToTerms: packageData.agreeToTerms,
          },
          status: "published", // Publish directly
          publishedAt: new Date(),
          updatedAt: new Date(),
        },
        $addToSet: {
          completedSteps: "packages",
        },
      },
      {
        new: true,
      }
    );

    // Update user subscription pitches used counter
    try {
      await UserSubscription.findOneAndUpdate(
        { user: userId },
        { $inc: { pitchesUsed: 1 } },
        { upsert: false }
      );
      console.log("Updated user subscription pitch count");
    } catch (subscriptionError) {
      console.error(
        "Error updating subscription pitch count:",
        subscriptionError
      );
      // Don't fail the pitch publishing if subscription update fails
    }

    // Clean up any additional empty drafts for this user
    const otherDrafts = await Pitch.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: "draft",
      _id: { $ne: updatedPitch?._id }, // Exclude the pitch we just published
    });

    // Delete any empty drafts
    const emptyDraftIds: string[] = [];
    for (const draft of otherDrafts) {
      if (!hasMeaningfulContent(draft)) {
        emptyDraftIds.push(String(draft._id));
      }
    }

    if (emptyDraftIds.length > 0) {
      await Pitch.deleteMany({
        _id: { $in: emptyDraftIds },
      });
      console.log(
        `Cleaned up ${emptyDraftIds.length} empty drafts after publishing`
      );
    }

    res.status(200).json({
      success: true,
      message: "Pitch published successfully",
      data: {
        package: updatedPitch?.package,
        completedSteps: updatedPitch?.completedSteps,
        status: updatedPitch?.status,
        _id: updatedPitch?._id,
      },
    });
  } catch (error) {
    console.error("Error publishing pitch:", error);
    return next(createHttpError(500, "Failed to publish pitch"));
  }
};

// Auto-save pitch data
const autoSavePitch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    const { stepData, stepName } = req.body;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    // Check if stepData has meaningful content
    const hasContent = (data: Record<string, unknown>): boolean => {
      if (!data || typeof data !== "object") return false;

      return Object.values(data).some((value) => {
        if (typeof value === "string") return value.trim().length > 0;
        if (typeof value === "number") return value > 0;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === "object" && value !== null)
          return hasContent(value as Record<string, unknown>);
        return Boolean(value);
      });
    };

    // Only proceed if there's meaningful content
    if (!hasContent(stepData)) {
      res.status(200).json({
        success: true,
        message: "No content to save",
        data: {
          lastSaved: new Date(),
          stepName,
        },
      });
      return;
    }

    const updateData: PitchUpdateData = {
      updatedAt: new Date(),
    };

    // Map step data to correct field
    if (stepName === "company-info") {
      updateData.companyInfo = stepData;
    } else if (stepName === "pitch-deal") {
      updateData.pitchDeal = stepData;
    } else if (stepName === "team") {
      updateData.team = stepData;
    } else if (stepName === "media") {
      updateData.media = stepData;
    } else if (stepName === "documents") {
      updateData.documents = stepData;
    } else if (stepName === "package") {
      updateData.package = stepData;
    }

    // First, try to find existing draft
    let pitch = await Pitch.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: "draft",
    });

    if (pitch) {
      // Update existing draft
      pitch = await Pitch.findByIdAndUpdate(
        pitch._id,
        {
          $set: updateData,
        },
        {
          new: true,
        }
      );
    } else {
      // Only create new draft if there's meaningful content AND no existing draft
      pitch = await Pitch.create({
        userId: new mongoose.Types.ObjectId(userId),
        status: "draft",
        isActive: true,
        completedSteps: [],
        ...updateData,
      });
    }

    res.status(200).json({
      success: true,
      message: "Pitch auto-saved successfully",
      data: {
        lastSaved: new Date(),
        stepName,
        draftId: pitch?._id,
      },
    });
  } catch (error) {
    console.error("Error auto-saving pitch:", error);
    return next(createHttpError(500, "Failed to auto-save pitch"));
  }
};

// Upload single file (generic endpoint)
const uploadFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { fileType } = req.params; // 'image', 'video', 'document'

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    if (!req.file) {
      return next(createHttpError(400, "No file uploaded"));
    }

    let folderName = "";
    let resourceType: "image" | "video" | "raw" = "raw";

    switch (fileType) {
      case "image":
        folderName = `pitches/${userId}/images`;
        resourceType = "image";
        break;
      case "video":
        folderName = `pitches/${userId}/videos`;
        resourceType = "video";
        break;
      case "document":
        folderName = `pitches/${userId}/documents`;
        resourceType = "raw";
        break;
      default:
        return next(createHttpError(400, "Invalid file type"));
    }

    const result = await uploadFileToCloudinary(
      req.file,
      folderName,
      resourceType
    );

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return next(createHttpError(500, "Failed to upload file"));
  }
};

// Delete file
const deleteFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { publicId, resourceType } = req.body;

    if (!publicId) {
      return next(createHttpError(400, "Public ID is required"));
    }

    await deleteFromCloudinary(publicId, resourceType || "auto");

    res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return next(createHttpError(500, "Failed to delete file"));
  }
};

// Delete pitch and update subscription counter
const deletePitch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { pitchId } = req.params;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    if (!mongoose.isValidObjectId(pitchId)) {
      return next(createHttpError(400, "Invalid pitch ID"));
    }

    // Find the pitch to ensure it belongs to the user
    const pitch = await Pitch.findOne({
      _id: pitchId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!pitch) {
      return next(
        createHttpError(
          404,
          "Pitch not found or you don't have permission to delete it"
        )
      );
    }

    const wasPublished = pitch.status === "published";

    // Delete the pitch
    await Pitch.findByIdAndDelete(pitchId);

    // If it was a published pitch, decrement the subscription counter
    if (wasPublished) {
      try {
        await UserSubscription.findOneAndUpdate(
          { user: userId },
          { $inc: { pitchesUsed: -1 } },
          { upsert: false }
        );
        console.log("Decremented user subscription pitch count after deletion");
      } catch (subscriptionError) {
        console.error(
          "Error updating subscription pitch count after deletion:",
          subscriptionError
        );
        // Don't fail the deletion if subscription update fails
      }
    }

    res.status(200).json({
      success: true,
      message: "Pitch deleted successfully",
      pitchId: pitchId,
      wasPublished: wasPublished,
    });
  } catch (error) {
    console.error("Error deleting pitch:", error);
    return next(createHttpError(500, "Failed to delete pitch"));
  }
};

// Get all pitches for user
const getUserPitches = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    const pitches = await Pitch.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ updatedAt: -1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      message: "Pitches retrieved successfully",
      data: pitches,
    });
  } catch (error) {
    console.error("Error getting user pitches:", error);
    return next(createHttpError(500, "Failed to get pitches"));
  }
};

// Get total count of published pitches for cache invalidation
const getPitchCount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const count = await Pitch.countDocuments({
      status: "published",
      isActive: true,
    });

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error("Error getting pitch count:", error);
    return next(createHttpError(500, "Failed to get pitch count"));
  }
};

// Get published pitches with advanced filtering and sorting
const getPublishedPitches = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      userSubscriptionPlan,
      userCountry,
      minInvestment,
      maxInvestment,
      countries,
      industries,
      stages,
      fundingTypes,
      sortBy = "newest",
      prioritizePremium = "true",
    } = req.query;

    // Get user role and userId for access control
    const userRole = req.query.userRole as string;
    const _req = req as AuthRequest;
    const viewerUserId = _req.userId;

    console.log("🔍 Getting published pitches with filters:", {
      page,
      limit,
      search,
      userSubscriptionPlan,
      userCountry,
      userRole,
      viewerUserId,
      minInvestment,
      maxInvestment,
      countries,
      industries,
      stages,
      fundingTypes,
      sortBy,
      prioritizePremium,
    });

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build enhanced query filters with proper MongoDB structure
    const baseMatchQuery: MongoQuery = {
      status: "published",
      isActive: true,
    };

    // Hide pitches from entrepreneurs with cancelled/expired subscriptions
    // BUT allow entrepreneurs to see their own pitches regardless of subscription status
    await hidePitchesFromCancelledEntrepreneurs(baseMatchQuery, viewerUserId);

    // Add debug logging for base query after filtering
    console.log(
      "🔍 Base query after entrepreneur filtering:",
      JSON.stringify(baseMatchQuery, null, 2)
    );

    // Collect all filter conditions
    const filterConditions: Record<string, unknown>[] = [];

    // Apply search filter (searches across multiple fields with OR logic)
    if (search) {
      filterConditions.push({
        $or: [
          { "companyInfo.pitchTitle": { $regex: search, $options: "i" } },
          { "companyInfo.industry1": { $regex: search, $options: "i" } },
          { "pitchDeal.summary": { $regex: search, $options: "i" } },
          { "companyInfo.country": { $regex: search, $options: "i" } },
        ],
      });
      console.log("🔍 Search filter applied:", search);
    }

    // Apply country filter (OR logic: show pitches from ANY selected country)
    if (countries) {
      const countryList = (countries as string).split(",").filter(Boolean);
      if (countryList.length > 0) {
        filterConditions.push({
          "companyInfo.country": { $in: countryList },
        });
        console.log("🔍 Country filter applied:", countryList);
      }
    }

    // Apply industry filter (OR logic: show pitches from ANY selected industry)
    if (industries) {
      const industryList = (industries as string).split(",").filter(Boolean);
      if (industryList.length > 0) {
        filterConditions.push({
          "companyInfo.industry1": { $in: industryList },
        });
        console.log("🔍 Industry filter applied:", industryList);
      }
    }

    // Apply business stages filter (OR logic: show pitches from ANY selected stage)
    if (stages) {
      const stageList = (stages as string).split(",").filter(Boolean);
      if (stageList.length > 0) {
        filterConditions.push({
          "companyInfo.stage": { $in: stageList },
        });
        console.log("🔍 Stages filter applied:", stageList);
      }
    }

    // Apply funding types filter (OR logic: show pitches with ANY selected funding type)
    if (fundingTypes) {
      const fundingTypeList = (fundingTypes as string)
        .split(",")
        .filter(Boolean);
      if (fundingTypeList.length > 0) {
        filterConditions.push({
          "pitchDeal.dealType": { $in: fundingTypeList },
        });
        console.log("🔍 Funding types filter applied:", fundingTypeList);
      }
    }

    // Apply investment range filter
    if (minInvestment || maxInvestment) {
      const minAmount = minInvestment ? parseInt(minInvestment as string) : 0;
      const maxAmount = maxInvestment
        ? parseInt(maxInvestment as string)
        : Number.MAX_SAFE_INTEGER;

      // Only apply filter if values are different from defaults
      if (minAmount > 1000 || maxAmount < 10000000) {
        filterConditions.push({
          $expr: {
            $and: [
              // Check minimum investment requirement
              {
                $gte: [
                  {
                    $convert: {
                      input: {
                        $regexReplace: {
                          input: {
                            $ifNull: ["$companyInfo.minimumInvestment", "0"],
                          },
                          regex: "[^0-9]",
                          replacement: "",
                        },
                      },
                      to: "int",
                      onError: 0,
                    },
                  },
                  minAmount,
                ],
              },
              // Check maximum investment (raising amount)
              {
                $lte: [
                  {
                    $convert: {
                      input: {
                        $regexReplace: {
                          input: {
                            $ifNull: [
                              "$companyInfo.raisingAmount",
                              "999999999",
                            ],
                          },
                          regex: "[^0-9]",
                          replacement: "",
                        },
                      },
                      to: "int",
                      onError: 999999999,
                    },
                  },
                  maxAmount,
                ],
              },
            ],
          },
        });
        console.log("🔍 Investment range filter applied:", {
          minAmount,
          maxAmount,
        });
      }
    }

    // Combine base query with all filter conditions using AND logic
    // (All filter conditions must be met, but within each filter, OR logic applies)
    const finalMatchQuery =
      filterConditions.length > 0
        ? { ...baseMatchQuery, $and: filterConditions }
        : baseMatchQuery;

    console.log(
      "🔍 Final query structure:",
      JSON.stringify(finalMatchQuery, null, 2)
    );

    // Build aggregation pipeline
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [
      { $match: finalMatchQuery },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      // Only include pitches that have valid users and are not unsubscribed
      {
        $match: {
          "user.0": { $exists: true },
          "user.isUnsubscribed": { $ne: true },
        },
      },
      { $unwind: "$user" },
    ];

    // NEW FILTERING LOGIC BASED ON VIEWER ROLE AND PITCH OWNER'S SUBSCRIPTION
    // Get viewer information for filtering
    let viewerUser: UserDocument | null = null;
    if (viewerUserId) {
      viewerUser = (await User.findById(viewerUserId).select(
        "role countryName"
      )) as UserDocument | null;
    }

    console.log("🔍 Viewer info:", {
      viewerUserId,
      viewerRole: viewerUser?.role,
      viewerCountry: viewerUser?.countryName,
      userRoleFromQuery: userRole,
    });

    // Apply role-based filtering
    if (
      viewerUser?.role === "entrepreneur" ||
      userRole === "entrepreneur" ||
      userRole === "Entrepreneur"
    ) {
      // ENTREPRENEURS can see ALL pitches regardless of plans or countries
      console.log("🔍 Entrepreneur access: Showing all pitches");
      // No additional filtering needed
    } else if (
      viewerUser?.role === "investor" ||
      userRole === "investor" ||
      userRole === "Investor"
    ) {
      // NEW LOGIC: INVESTORS see pitches based on THEIR OWN subscription status
      const viewerCountry = viewerUser?.countryName || userCountry;

      // Check if investor has the "Investor Access Plan" subscription
      let hasInvestorAccessPlan = false;
      if (viewerUserId) {
        try {
          const investorUser = await User.findById(viewerUserId).select(
            "subscriptionPlan"
          );

          // Primary check: User.subscriptionPlan (updated immediately after purchase)
          hasInvestorAccessPlan =
            investorUser?.subscriptionPlan === "Investor Access Plan";

          console.log(
            "🔍 Published Pitches: Investor subscription plan check:",
            {
              userId: viewerUserId,
              subscriptionPlan: investorUser?.subscriptionPlan,
              hasInvestorAccessPlan,
            }
          );
        } catch (error) {
          console.error("Error checking investor subscription plan:", error);
        }
      }

      if (hasInvestorAccessPlan) {
        // Investor with Investor Access Plan: Global access to all pitches
        console.log(
          "🔍 Investor with Investor Access Plan: Global access to all pitches"
        );
        // No filtering needed - show all pitches
      } else {
        // Investor without Investor Access Plan: Only local pitches
        console.log(
          "🔍 Investor without Investor Access Plan: Local access only for country:",
          viewerCountry
        );

        pipeline.push({
          $match: {
            "companyInfo.country": viewerCountry,
          },
        });
      }

      console.log(
        "🔍 Applied investor filtering based on investor's subscription plan (Investor Access Plan required for global access)"
      );
    } else {
      // DEFAULT to Entrepreneur behavior if role is unclear (shouldn't happen in normal flow)
      console.log(
        "🔍 Unknown role - defaulting to Entrepreneur access: Showing all pitches"
      );
      // No additional filtering needed - same as entrepreneur
    }

    // Add sorting logic
    if (prioritizePremium === "true") {
      // Sort by subscription plan first (premium first), then by creation date
      pipeline.push({
        $addFields: {
          subscriptionPriority: {
            $cond: [
              {
                $or: [
                  { $eq: ["$user.subscriptionPlan", "premium"] },
                  { $eq: ["$user.subscriptionPlan", "Premium"] },
                  { $eq: ["$user.subscriptionPlan", "Investor Access Plan"] },
                ],
              },
              1,
              0,
            ],
          },
        },
      });
    }

    // Add final sorting
    const sortStage: SortStage = {};
    if (prioritizePremium === "true") {
      sortStage.subscriptionPriority = -1;
    }

    if (sortBy === "newest") {
      sortStage.publishedAt = -1;
      sortStage.createdAt = -1;
    } else if (sortBy === "oldest") {
      sortStage.publishedAt = 1;
      sortStage.createdAt = 1;
    }

    pipeline.push({ $sort: sortStage });

    // Get total count for pagination before applying limit
    const countPipeline = [...pipeline, { $count: "total" }];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalResult = (await Pitch.aggregate(countPipeline)) as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalItems = (totalResult[0] as any)?.total || 0;
    const totalPages = Math.ceil(totalItems / limitNum);

    // Add pagination to main pipeline
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNum });

    // Project required fields
    pipeline.push({
      $project: {
        _id: 1,
        companyInfo: 1,
        pitchDeal: 1,
        media: 1,
        publishedAt: 1,
        createdAt: 1,
        status: 1,
        "user.subscriptionPlan": 1,
        "user.role": 1,
        "user.fullName": 1,
        "user.avatarImage": 1,
      },
    });

    // Execute aggregation
    const pitches = await Pitch.aggregate(pipeline);

    console.log("🔍 Aggregation pipeline results:", {
      pipelineStages: pipeline.length,
      pitchesFound: pitches.length,
      samplePitch: pitches[0]
        ? {
            id: pitches[0]._id,
            title: pitches[0].companyInfo?.pitchTitle,
            user: pitches[0].user?.fullName,
            userPlan: pitches[0].user?.subscriptionPlan,
          }
        : "No pitches found",
    });

    // Get counts by subscription type for meta
    const metaPipeline = [
      ...pipeline.slice(0, -3), // Remove skip, limit, project
      {
        $group: {
          _id: "$user.subscriptionPlan",
          count: { $sum: 1 },
        },
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metaResult = (await Pitch.aggregate(metaPipeline)) as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const premiumCount = metaResult.reduce((total: number, item: any) => {
      if (
        item._id === "premium" ||
        item._id === "Premium" ||
        item._id === "Investor Access Plan"
      ) {
        return total + item.count;
      }
      return total;
    }, 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const basicCount = metaResult.reduce((total: number, item: any) => {
      if (item._id === "basic" || item._id === "Basic") {
        return total + item.count;
      }
      return total;
    }, 0);

    const response = {
      success: true,
      data: {
        pitches,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
        meta: {
          premiumCount,
          basicCount,
          filteredCount: totalItems,
          viewerRole: viewerUser?.role || userRole || "unknown",
          filteringApplied: viewerUser?.role || userRole || "unknown",
        },
      },
    };

    console.log("✅ Published pitches retrieved successfully:", {
      total: totalItems,
      premium: premiumCount,
      basic: basicCount,
      returned: pitches.length,
      viewerRole: viewerUser?.role || userRole || "unknown",
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting published pitches:", error);
    return next(createHttpError(500, "Failed to get published pitches"));
  }
};

// Get featured pitches for home page (prioritize premium pitches)
const getFeaturedPitches = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category = "trending" } = req.query;
    const _req = req as AuthRequest;
    const viewerUserId = _req.userId;

    // Define sort criteria and filters based on category
    let sortCriteria: Record<string, 1 | -1> = {};
    let timeFilter: Record<string, unknown> = {};
    let limit = 3; // Limit to 3 featured pitches for home page

    switch (category) {
      case "trending":
        // Sort by engagement metrics (you can adjust this based on your engagement tracking)
        sortCriteria = { publishedAt: -1, "companyInfo.raisedSoFar": -1 };
        break;
      case "newest": {
        sortCriteria = { publishedAt: -1 };
        // Filter for pitches published within the last 4 hours
        const fourHoursAgo = new Date();
        fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);
        timeFilter = { publishedAt: { $gte: fourHoursAgo } };
        break;
      }
      case "closing":
        // Sort by closest to funding deadline (if you have this field)
        sortCriteria = { publishedAt: -1 };
        limit = 3;
        break;
      default:
        sortCriteria = { publishedAt: -1 };
    }

    const pitches = (await Pitch.find({
      status: "published",
      isActive: true,
      ...timeFilter,
    })
      .populate({
        path: "userId",
        select:
          "fullName avatarImage isUnsubscribed subscriptionPlan countryName role",
        match: {
          isUnsubscribed: { $ne: true },
        },
      })
      .sort(sortCriteria)
      .select(
        "companyInfo pitchDeal media publishedAt"
      )) as PopulatedPitchDocument[];

    // Filter out pitches where userId is null (from unsubscribed users)
    const basePitches = pitches.filter((pitch) => pitch.userId !== null);

    // NEW FILTERING LOGIC - Apply subscription-based visibility filtering
    let filteredPitches = basePitches;

    // Get viewer information for filtering
    let viewerUser: UserDocument | null = null;
    if (viewerUserId) {
      viewerUser = (await User.findById(viewerUserId).select(
        "role countryName"
      )) as UserDocument | null;
    }

    console.log("🔍 Featured pitches - Viewer info:", {
      viewerUserId,
      viewerRole: viewerUser?.role,
      viewerCountry: viewerUser?.countryName,
    });

    if (viewerUser?.role === "entrepreneur") {
      // ENTREPRENEURS can see ALL pitches regardless of plans or countries
      console.log("🔍 Featured: Entrepreneur access - Showing all pitches");
      filteredPitches = basePitches;
    } else if (viewerUser?.role === "investor") {
      // NEW LOGIC: INVESTORS see pitches based on THEIR OWN subscription status
      const viewerCountry = viewerUser?.countryName;

      // Check if investor has the "Investor Access Plan" subscription
      let hasInvestorAccessPlan = false;
      if (viewerUserId) {
        try {
          const investorUser = await User.findById(viewerUserId).select(
            "subscriptionPlan"
          );
          hasInvestorAccessPlan =
            investorUser?.subscriptionPlan === "Investor Access Plan";
          console.log("🔍 Featured: Investor subscription plan check:", {
            userId: viewerUserId,
            subscriptionPlan: investorUser?.subscriptionPlan,
            hasInvestorAccessPlan,
          });
        } catch (error) {
          console.error(
            "Error checking investor subscription plan in featured:",
            error
          );
        }
      }

      if (hasInvestorAccessPlan) {
        // Investor with Investor Access Plan: Global access to all pitches
        console.log(
          "🔍 Featured: Investor with Investor Access Plan - Global access to all pitches"
        );
        filteredPitches = basePitches; // Show all pitches
      } else {
        // Investor without Investor Access Plan: Only local pitches
        console.log(
          "🔍 Featured: Investor without Investor Access Plan - Local access only for country:",
          viewerCountry
        );

        filteredPitches = basePitches.filter((pitch) => {
          const pitchCountry = pitch.companyInfo?.country;
          return pitchCountry === viewerCountry;
        });
      }

      console.log(
        "🔍 Featured: Applied investor filtering based on investor's subscription plan (Investor Access Plan required for global access)"
      );
    } else {
      // DEFAULT to Entrepreneur behavior if role is unclear
      console.log(
        "🔍 Featured: Unknown role - defaulting to Entrepreneur access: Showing all pitches"
      );
      filteredPitches = basePitches; // Same as entrepreneur - show all pitches
    }

    // Prioritize Premium pitches - they should appear first
    const sortedPitches = filteredPitches.sort((a, b) => {
      const aUser = a.userId;
      const bUser = b.userId;
      const aIsPremium =
        aUser?.subscriptionPlan === "Premium" ||
        aUser?.subscriptionPlan === "premium" ||
        aUser?.subscriptionPlan === "Investor Access Plan";
      const bIsPremium =
        bUser?.subscriptionPlan === "Premium" ||
        bUser?.subscriptionPlan === "premium" ||
        bUser?.subscriptionPlan === "Investor Access Plan";

      // Premium pitches first
      if (aIsPremium && !bIsPremium) return -1;
      if (!aIsPremium && bIsPremium) return 1;

      // If both are same tier, sort by published date (newest first)
      return (
        new Date(b.publishedAt || 0).getTime() -
        new Date(a.publishedAt || 0).getTime()
      );
    });

    // Apply limit after sorting
    const featuredPitches = sortedPitches.slice(0, limit);

    console.log("✅ Featured pitches retrieved:", {
      total: basePitches.length,
      filtered: filteredPitches.length,
      returned: featuredPitches.length,
      viewerRole: viewerUser?.role || "unknown",
    });

    res.status(200).json({
      success: true,
      message: "Featured pitches retrieved successfully",
      data: featuredPitches,
    });
  } catch (error) {
    console.error("Error getting featured pitches:", error);
    return next(createHttpError(500, "Failed to get featured pitches"));
  }
};

// Get single pitch by ID
const getPitchById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const viewerUserId = req.userId; // Optional - set by optionalTokenVerification

    if (!mongoose.isValidObjectId(id)) {
      return next(createHttpError(400, "Invalid pitch ID"));
    }

    const pitch = await Pitch.findById(id)
      .populate("userId", "fullName avatarImage email phoneNumber")
      .select("-package.paymentMethod -package.paymentStatus");

    if (!pitch) {
      return next(createHttpError(404, "Pitch not found"));
    }

    // Only show published pitches to public
    if (pitch.status !== "published") {
      return next(createHttpError(403, "Pitch is not publicly available"));
    }

    // Check if viewer is an entrepreneur who is NOT the owner of this pitch
    let isRestrictedEntrepreneur = false;
    if (viewerUserId) {
      const viewer = await User.findById(viewerUserId).select("role");
      const isOwner = pitch.userId._id.toString() === viewerUserId.toString();

      if (viewer?.role === "Entrepreneur" && !isOwner) {
        isRestrictedEntrepreneur = true;
        console.log(
          `🔒 Restricting pitch details for entrepreneur ${viewerUserId} viewing pitch ${id}`
        );
      }
    }

    // Create restricted version for entrepreneurs (to prevent copying)
    if (isRestrictedEntrepreneur) {
      const restrictedPitch = {
        _id: pitch._id,
        userId: pitch.userId, // Keep user info
        companyInfo: {
          pitchTitle: pitch.companyInfo.pitchTitle,
          industry1: pitch.companyInfo.industry1,
          country: pitch.companyInfo.country,
          // Hide detailed company info
        },
        media: {
          logo: pitch.media?.logo || null,
          // Hide other media files
        },
        pitchDeal: {
          dealType: pitch.pitchDeal?.dealType,
          // Hide detailed deal information
        },
        // Hide team details, documents, and other sensitive information
        status: pitch.status,
        createdAt: pitch.createdAt,
        updatedAt: pitch.updatedAt,
      };

      res.status(200).json({
        success: true,
        message: "Pitch preview retrieved successfully",
        data: restrictedPitch,
        restricted: true, // Flag to indicate this is a restricted view
      });
      return;
    }

    // Full access for pitch owner, investors, and unauthenticated users
    res.status(200).json({
      success: true,
      message: "Pitch retrieved successfully",
      data: pitch,
      restricted: false,
    });
  } catch (error) {
    console.error("Error getting pitch by ID:", error);
    return next(createHttpError(500, "Failed to get pitch"));
  }
};

// Get single pitch by ID for owner (authenticated)
const getPitchByIdForOwner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    if (!mongoose.isValidObjectId(id)) {
      return next(createHttpError(400, "Invalid pitch ID"));
    }

    const pitch = await Pitch.findById(id)
      .populate("userId", "fullName avatarImage email phoneNumber")
      .select("-package.paymentMethod -package.paymentStatus");

    if (!pitch) {
      return next(createHttpError(404, "Pitch not found"));
    }

    // Check if user owns this pitch
    if (pitch.userId._id.toString() !== userId) {
      return next(
        createHttpError(403, "You don't have permission to view this pitch")
      );
    }

    res.status(200).json({
      success: true,
      message: "Pitch retrieved successfully",
      data: pitch,
    });
  } catch (error) {
    console.error("Error getting pitch by ID for owner:", error);
    return next(createHttpError(500, "Failed to get pitch"));
  }
};

// Remove specific media file from pitch
const removeMediaFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { fileType, publicId } = req.body; // fileType: 'logo', 'banner', 'uploadedVideo'

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    if (!fileType || !publicId) {
      return next(createHttpError(400, "File type and public ID are required"));
    }

    // Find the user's draft pitch
    const pitch = await Pitch.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: "draft",
    });

    if (!pitch) {
      return next(createHttpError(404, "No draft pitch found"));
    }

    // Delete file from Cloudinary
    try {
      const resourceType = fileType === "uploadedVideo" ? "video" : "image";
      await deleteFromCloudinary(publicId, resourceType);
    } catch (error) {
      console.error("Error deleting file from Cloudinary:", error);
      // Continue even if Cloudinary deletion fails
    }

    // Remove file reference from database
    const updateQuery: Record<string, unknown> = { updatedAt: new Date() };

    if (fileType === "logo") {
      updateQuery["media.logo"] = null;
    } else if (fileType === "banner") {
      updateQuery["media.banner"] = null;
    } else if (fileType === "uploadedVideo") {
      updateQuery["media.uploadedVideo"] = null;
    }

    const updatedPitch = await Pitch.findByIdAndUpdate(
      pitch._id,
      { $unset: updateQuery },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "File removed successfully",
      data: {
        media: updatedPitch?.media,
      },
    });
  } catch (error) {
    console.error("Error removing media file:", error);
    return next(createHttpError(500, "Failed to remove file"));
  }
};

// Helper function to check if a pitch has meaningful content
const hasMeaningfulContent = (
  pitch: Record<string, unknown> | unknown
): boolean => {
  if (!pitch || typeof pitch !== "object") return false;

  const pitchObj = pitch as Record<string, unknown>;

  // Check if companyInfo has meaningful data
  const companyInfo = pitchObj.companyInfo as Record<string, unknown>;
  if (
    companyInfo &&
    ((companyInfo.pitchTitle as string)?.trim() ||
      (companyInfo.website as string)?.trim() ||
      (companyInfo.phoneNumber as string)?.trim())
  ) {
    return true;
  }

  // Check if pitchDeal has meaningful data
  const pitchDeal = pitchObj.pitchDeal as Record<string, unknown>;
  if (
    pitchDeal &&
    ((pitchDeal.summary as string)?.trim() ||
      (pitchDeal.business as string)?.trim() ||
      (pitchDeal.market as string)?.trim())
  ) {
    return true;
  }

  // Check if team has meaningful data
  const team = pitchObj.team as Record<string, unknown>;
  if (
    team &&
    team.members &&
    Array.isArray(team.members) &&
    team.members.length > 0
  ) {
    const hasValidMembers = team.members.some(
      (member: Record<string, unknown>) =>
        (member.name as string)?.trim() ||
        (member.role as string)?.trim() ||
        (member.bio as string)?.trim()
    );
    if (hasValidMembers) return true;
  }

  // Check if media has meaningful data
  const media = pitchObj.media as Record<string, unknown>;
  if (
    media &&
    ((media.logo as Record<string, unknown>)?.url ||
      (media.banner as Record<string, unknown>)?.url ||
      (media.youtubeUrl as string)?.trim() ||
      (media.uploadedVideo as Record<string, unknown>)?.url ||
      (Array.isArray(media.images) && media.images.length > 0))
  ) {
    return true;
  }

  // Check if documents have meaningful data
  const documents = pitchObj.documents as Record<string, unknown>;
  if (
    documents &&
    ((documents.businessPlan as Record<string, unknown>)?.url ||
      (documents.financials as Record<string, unknown>)?.url ||
      (documents.pitchDeck as Record<string, unknown>)?.url ||
      (documents.executiveSummary as Record<string, unknown>)?.url ||
      (Array.isArray(documents.additionalDocuments) &&
        documents.additionalDocuments.length > 0))
  ) {
    return true;
  }

  return false;
};

// Cleanup empty drafts function
const cleanupEmptyDrafts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    // Find all draft pitches for user
    const drafts = await Pitch.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: "draft",
    });

    // Filter out meaningful drafts and delete empty ones
    const emptyDraftIds: string[] = [];
    for (const draft of drafts) {
      if (!hasMeaningfulContent(draft)) {
        emptyDraftIds.push(String(draft._id));
      }
    }

    if (emptyDraftIds.length > 0) {
      await Pitch.deleteMany({
        _id: { $in: emptyDraftIds },
      });
    }

    res.status(200).json({
      success: true,
      message: `Cleaned up ${emptyDraftIds.length} empty drafts`,
      data: {
        deletedCount: emptyDraftIds.length,
      },
    });
  } catch (error) {
    console.error("Error cleaning up empty drafts:", error);
    return next(createHttpError(500, "Failed to cleanup empty drafts"));
  }
};

// Test endpoint to check database contents and subscription filtering
const testPitchData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("🔍 Testing pitch data and subscription filtering...");

    // Check total pitches
    const totalPitches = await Pitch.countDocuments();
    console.log("Total pitches in database:", totalPitches);

    // Check published pitches
    const publishedPitches = await Pitch.countDocuments({
      status: "published",
      isActive: true,
    });
    console.log("Published and active pitches:", publishedPitches);

    // Get all published pitches with user data
    const pitches = await Pitch.find({ status: "published", isActive: true })
      .populate("userId", "fullName role subscriptionPlan countryName")
      .exec();
    console.log("Published pitches details:");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pitches.forEach((pitch: any, index: number) => {
      console.log(
        `${index + 1}. ID: ${pitch._id}, UserID: ${pitch.userId?._id}, ` +
          `Title: ${pitch.companyInfo?.pitchTitle}, Country: ${pitch.companyInfo?.country}, ` +
          `Creator Role: ${pitch.userId?.role}, Creator Plan: ${pitch.userId?.subscriptionPlan}`
      );
    });

    // Check users by role and subscription
    const entrepreneurs = await User.find({ role: "Entrepreneur" });
    const investors = await User.find({ role: "Investor" });
    const investorAccessUsers = await User.find({
      subscriptionPlan: "Investor Access Plan",
    });

    console.log("User summary:");
    console.log(`- Total Entrepreneurs: ${entrepreneurs.length}`);
    console.log(`- Total Investors: ${investors.length}`);
    console.log(
      `- Users with Investor Access Plan: ${investorAccessUsers.length}`
    );

    // Test the filtering logic for different user types
    console.log("\n🔍 Testing subscription filtering logic:");

    // Test 1: Entrepreneur should see all pitches
    console.log("1. Entrepreneur access test:");
    const entrepreneurUser = entrepreneurs[0];
    if (entrepreneurUser) {
      console.log(
        `   - Entrepreneur ${entrepreneurUser.fullName} should see ALL ${pitches.length} pitches globally`
      );
    }

    // Test 2: Investor with Investor Access Plan should see all pitches
    console.log("2. Investor with Investor Access Plan test:");
    const investorAccessUser = investorAccessUsers[0];
    if (investorAccessUser) {
      console.log(
        `   - Investor ${investorAccessUser.fullName} with Investor Access Plan should see ALL ${pitches.length} pitches globally`
      );
    }

    // Test 3: Basic investor should only see local pitches
    console.log("3. Basic investor access test:");
    const basicInvestor = await User.findOne({
      role: "Investor",
      subscriptionPlan: { $ne: "Investor Access Plan" },
    });
    if (basicInvestor) {
      const localPitches = pitches.filter(
        (pitch) => pitch.companyInfo?.country === basicInvestor.countryName
      );
      console.log(
        `   - Basic investor ${basicInvestor.fullName} from ${basicInvestor.countryName} should see ${localPitches.length} local pitches only`
      );
    }

    // Check if pitch userIDs exist in users collection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pitchUserIds = pitches.map((p: any) => p.userId?._id).filter(Boolean);
    const existingUsers = await User.find({ _id: { $in: pitchUserIds } });
    console.log("Pitches with valid users:", existingUsers.length);

    res.status(200).json({
      success: true,
      message:
        "Pitch data and subscription filtering test completed - check console logs",
      data: {
        totalPitches,
        publishedPitches,
        userSummary: {
          entrepreneurs: entrepreneurs.length,
          investors: investors.length,
          investorAccessUsers: investorAccessUsers.length,
        },
        testResults: {
          entrepreneurAccess: "Should see all pitches globally",
          investorAccessPlanAccess: "Should see all pitches globally",
          basicInvestorAccess:
            "Should see only local pitches from their country",
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pitchDetails: pitches.map((p: any) => ({
          id: p._id,
          userId: p.userId,
          title: p.companyInfo?.pitchTitle,
          country: p.companyInfo?.country,
        })),
        totalUsers: entrepreneurs.length + investors.length,
        validUserPitches: existingUsers.length,
      },
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return next(createHttpError(500, "Failed to test pitch data"));
  }
};

// Test endpoint specifically for filtering functionality (languages filter removed)
const testFiltering = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("🧪 Testing pitch filtering functionality...");
    console.log("🔍 Received query parameters:", req.query);

    const { countries, industries, stages } = req.query;

    // Test each filter type
    const testResults: TestResults = {};

    // Test country filtering
    if (countries) {
      const countryList = (countries as string).split(",").filter(Boolean);
      const countryMatches = await Pitch.find({
        status: "published",
        isActive: true,
        "companyInfo.country": { $in: countryList },
      }).populate("userId", "subscriptionPlan role");

      testResults.countries = {
        requested: countryList,
        matches: countryMatches.length,
        sampleMatches: countryMatches.slice(0, 3).map((p) => ({
          title: p.companyInfo?.pitchTitle || "",
          country: p.companyInfo?.country || "",
          userPlan:
            (p.userId as unknown as UserDocument)?.subscriptionPlan || "",
        })),
      };
    }

    // Test industry filtering
    if (industries) {
      const industryList = (industries as string).split(",").filter(Boolean);
      const industryMatches = await Pitch.find({
        status: "published",
        isActive: true,
        "companyInfo.industry1": { $in: industryList },
      }).populate("userId", "subscriptionPlan role");

      testResults.industries = {
        requested: industryList,
        matches: industryMatches.length,
        sampleMatches: industryMatches.slice(0, 3).map((p) => ({
          title: p.companyInfo?.pitchTitle || "",
          industry: p.companyInfo?.industry1 || "",
          userPlan:
            (p.userId as unknown as UserDocument)?.subscriptionPlan || "",
        })),
      };
    }

    // Test stages filtering
    if (stages) {
      const stageList = (stages as string).split(",").filter(Boolean);
      const stageMatches = await Pitch.find({
        status: "published",
        isActive: true,
        "companyInfo.stage": { $in: stageList },
      }).populate("userId", "subscriptionPlan role");

      testResults.stages = {
        requested: stageList,
        matches: stageMatches.length,
        sampleMatches: stageMatches.slice(0, 3).map((p) => ({
          title: p.companyInfo?.pitchTitle || "",
          stage: p.companyInfo?.stage || "",
          userPlan:
            (p.userId as unknown as UserDocument)?.subscriptionPlan || "",
        })),
      };
    }

    // Get sample data for understanding
    const allPitches = await Pitch.find({
      status: "published",
      isActive: true,
    })
      .populate("userId", "subscriptionPlan role")
      .limit(10);

    const sampleData = {
      totalPublishedPitches: await Pitch.countDocuments({
        status: "published",
        isActive: true,
      }),
      availableCountries: [
        ...new Set(
          allPitches.map((p) => p.companyInfo?.country).filter(Boolean)
        ),
      ],
      availableIndustries: [
        ...new Set(
          allPitches.map((p) => p.companyInfo?.industry1).filter(Boolean)
        ),
      ],
      availableStages: [
        ...new Set(allPitches.map((p) => p.companyInfo?.stage).filter(Boolean)),
      ],
      samplePitches: allPitches.slice(0, 5).map((p) => ({
        title: p.companyInfo?.pitchTitle || "",
        country: p.companyInfo?.country || "",
        industry: p.companyInfo?.industry1 || "",
        stage: p.companyInfo?.stage || "",
        userPlan: (p.userId as unknown as UserDocument)?.subscriptionPlan || "",
        userRole: (p.userId as unknown as UserDocument)?.role || "",
      })),
    };

    res.status(200).json({
      success: true,
      message: "Filter testing completed",
      data: {
        requestedFilters: req.query,
        testResults,
        sampleData,
      },
    });
  } catch (error) {
    console.error("❌ Error testing filters:", error);
    return next(createHttpError(500, "Failed to test filtering"));
  }
};

// Check if entrepreneur can publish pitches (for frontend restrictions)
const checkPublishingRights = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    const publishingRights = await checkEntrepreneurPublishingRights(userId);

    res.status(200).json({
      success: true,
      data: {
        canPublish: publishingRights.canPublish,
        reason: publishingRights.reason,
        message: publishingRights.canPublish
          ? "You can publish pitches"
          : publishingRights.reason,
      },
    });
  } catch (error) {
    console.error("Error checking publishing rights:", error);
    return next(createHttpError(500, "Failed to check publishing rights"));
  }
};

// DEBUG FUNCTION: Reactivate entrepreneur subscriptions for development
const reactivateEntrepreneurSubscriptions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (process.env.NODE_ENV !== "development") {
      return next(createHttpError(403, "Only available in development mode"));
    }

    // Find all entrepreneurs with published pitches
    const entrepreneursWithPitches = await Pitch.find({
      status: "published",
      isActive: true,
    }).distinct("userId");

    console.log(
      "🔧 Found entrepreneurs with published pitches:",
      entrepreneursWithPitches.length
    );

    // Update their subscriptions to be active
    const updateResult = await UserSubscription.updateMany(
      {
        user: { $in: entrepreneursWithPitches },
      },
      {
        $set: {
          active: true,
          status: "active",
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      }
    );

    console.log("🔧 Reactivated subscriptions:", updateResult.modifiedCount);

    res.status(200).json({
      success: true,
      message: `Reactivated ${updateResult.modifiedCount} entrepreneur subscriptions`,
      data: {
        entrepreneursFound: entrepreneursWithPitches.length,
        subscriptionsReactivated: updateResult.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Error reactivating subscriptions:", error);
    return next(createHttpError(500, "Failed to reactivate subscriptions"));
  }
};

// Helper function to hide pitches from entrepreneurs with cancelled/expired subscriptions
// Allows entrepreneurs to see their own pitches regardless of subscription status
const hidePitchesFromCancelledEntrepreneurs = async (
  baseMatchQuery: MongoQuery,
  viewerUserId?: string
) => {
  try {
    // Find entrepreneurs with TRULY inactive subscriptions
    // A subscription is inactive if:
    // 1. active: false (explicitly marked inactive)
    // 2. OR status is not "active" or "trialing" AND current period has ended
    // 3. OR no subscription exists

    const now = new Date();

    // Find all subscriptions that are truly inactive
    const inactiveSubscriptions = await UserSubscription.find({
      $or: [
        // Explicitly marked as inactive
        { active: false },
        // Status is cancelled/expired AND period has ended
        {
          status: { $in: ["cancelled", "canceled", "expired"] },
          currentPeriodEnd: { $lt: now },
        },
        // Status exists but is not active/trialing AND period has ended
        {
          status: {
            $nin: ["active", "trialing"],
            $exists: true,
          },
          currentPeriodEnd: { $lt: now },
        },
      ],
    }).populate("user");

    // Also find users who have no subscription at all (entrepreneurs need subscriptions)
    const allUsers = await User.find({ role: "Entrepreneur" });
    const usersWithSubscriptions = await UserSubscription.find({}).distinct(
      "user"
    );
    const usersWithoutSubscriptions = allUsers
      .filter(
        (user) =>
          !usersWithSubscriptions.some(
            (subUserId) => subUserId.toString() === user._id.toString()
          )
      )
      .map((user) => user._id);

    // Combine both groups: users with inactive subscriptions + users with no subscriptions
    const inactiveEntrepreneurIds = [
      ...inactiveSubscriptions
        .filter((sub) => sub.user && (sub.user as any).role === "Entrepreneur")
        .map((sub) => (sub.user as any)._id),
      ...usersWithoutSubscriptions,
    ];

    if (inactiveEntrepreneurIds.length > 0) {
      // If viewer is logged in, allow them to see their own pitches even if subscription is inactive
      let usersToExclude = inactiveEntrepreneurIds;
      if (viewerUserId) {
        usersToExclude = inactiveEntrepreneurIds.filter(
          (userId) => userId.toString() !== viewerUserId.toString()
        );
        if (usersToExclude.length < inactiveEntrepreneurIds.length) {
          console.log(
            `✅ Allowing viewer (${viewerUserId}) to see their own pitches despite inactive subscription`
          );
        }
      }

      if (usersToExclude.length > 0) {
        // Exclude pitches from entrepreneurs with truly inactive subscriptions
        baseMatchQuery.userId = { $nin: usersToExclude };
        console.log(
          `🚫 Hiding ${usersToExclude.length} pitches from entrepreneurs without active subscriptions`
        );
      }

      console.log("🔍 Inactive entrepreneur check details:", {
        totalInactiveSubscriptions: inactiveSubscriptions.length,
        entrepreneursWithoutSubscriptions: usersWithoutSubscriptions.length,
        currentTime: now.toISOString(),
      });
    } else {
      console.log("✅ All entrepreneurs have active subscriptions");
    }

    // Debug: Check total published pitches count
    const totalPublishedPitches = await Pitch.countDocuments({
      status: "published",
      isActive: true,
    });
    console.log(
      "🔍 Total published pitches in database:",
      totalPublishedPitches
    );

    // Debug: Check how many pitches remain after filtering
    const remainingPitches = await Pitch.countDocuments(baseMatchQuery);
    console.log(
      "🔍 Pitches remaining after entrepreneur filtering:",
      remainingPitches
    );
  } catch (error) {
    console.error("❌ Error filtering inactive entrepreneur pitches:", error);
  }
};

export {
  getPitchDraft,
  updateCompanyInfo,
  updatePitchDeal,
  updateTeam,
  updateMedia,
  updateDocuments,
  updatePackage,
  autoSavePitch,
  uploadFile,
  deleteFile,
  deletePitch,
  getUserPitches,
  getPitchCount,
  getPublishedPitches,
  getFeaturedPitches,
  getPitchById,
  getPitchByIdForOwner,
  removeMediaFile,
  cleanupEmptyDrafts,
  testPitchData,
  testFiltering,
  checkPublishingRights,
  reactivateEntrepreneurSubscriptions,
};
