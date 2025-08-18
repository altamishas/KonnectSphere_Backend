import { Response, NextFunction } from "express";
import createHttpError from "http-errors";
import { AuthRequest } from "./tokenVerification";
import User from "../user/userModel";
import {
  UserSubscription,
  IUserSubscription,
} from "../subscription/subscriptionModel";
import Pitch from "../pitch/pitchModel";

// Type definitions for data filtering
type DatabaseDocument = Record<string, unknown>;

// Interface for pitch data
interface PitchDocument extends DatabaseDocument {
  companyInfo?: {
    country?: string;
    [key: string]: unknown;
  };
  userId?: {
    subscriptionPlan?: string;
    [key: string]: unknown;
  };
  status?: string;
  isActive?: boolean;
}

// Interface for subscription plan restrictions
export interface SubscriptionRestrictions {
  pitchLimit: number;
  globalVisibility: boolean;
  documentsAllowed: boolean;
  investorAccessGlobal: boolean;
  featuredInSearch: boolean;
}

// Define subscription plan restrictions
const PLAN_RESTRICTIONS: Record<string, SubscriptionRestrictions> = {
  // Free plan for new users (no subscription)
  Free: {
    pitchLimit: 0,
    globalVisibility: false,
    documentsAllowed: false,
    investorAccessGlobal: false,
    featuredInSearch: false,
  },
  Basic: {
    pitchLimit: 1,
    globalVisibility: false,
    documentsAllowed: true, // Document uploads now allowed for Basic plan
    investorAccessGlobal: false,
    featuredInSearch: false,
  },
  Premium: {
    pitchLimit: 5,
    globalVisibility: true,
    documentsAllowed: true,
    investorAccessGlobal: true,
    featuredInSearch: true,
  },
  "Investor Access Plan": {
    pitchLimit: 5,
    globalVisibility: true,
    documentsAllowed: true,
    investorAccessGlobal: true,
    featuredInSearch: true,
  },
  // Default for any unrecognized plan or no subscription
  default: {
    pitchLimit: 0,
    globalVisibility: false,
    documentsAllowed: false,
    investorAccessGlobal: false,
    featuredInSearch: false,
  },
};

// Get user subscription restrictions
export const getUserSubscriptionRestrictions = async (
  userId: string
): Promise<SubscriptionRestrictions> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return PLAN_RESTRICTIONS["default"];
    }

    const planName = user.subscriptionPlan || "Basic";
    return PLAN_RESTRICTIONS[planName] || PLAN_RESTRICTIONS["default"];
  } catch (error) {
    console.error("Error getting subscription restrictions:", error);
    return PLAN_RESTRICTIONS["default"];
  }
};

// Get user subscription with populated data
export const getUserSubscriptionData = async (
  userId: string
): Promise<IUserSubscription | null> => {
  try {
    const userSubscription = await UserSubscription.findOne({ user: userId })
      .populate("subscription")
      .populate("subscriptionPrice");

    return userSubscription as IUserSubscription | null;
  } catch (error) {
    console.error("Error getting user subscription data:", error);
    return null;
  }
};

// Middleware to check if user can publish another pitch
export const checkPitchLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "Entrepreneur") {
      return next(
        createHttpError(403, "Only entrepreneurs can publish pitches")
      );
    }

    const restrictions = await getUserSubscriptionRestrictions(userId);

    // Count current published pitches
    const publishedPitchesCount = await Pitch.countDocuments({
      userId: userId,
      status: "published",
      isActive: true,
    });

    if (publishedPitchesCount >= restrictions.pitchLimit) {
      return next(
        createHttpError(
          403,
          `You have reached your pitch limit of ${restrictions.pitchLimit} for your ${user.subscriptionPlan} plan. Please upgrade to publish more pitches.`
        )
      );
    }

    // Add restrictions to request for use in controllers
    req.subscriptionRestrictions = restrictions;
    req.publishedPitchesCount = publishedPitchesCount;

    next();
  } catch (error) {
    console.error("Error checking pitch limit:", error);
    return next(createHttpError(500, "Error checking pitch limitations"));
  }
};

// Middleware to check if user can upload documents
export const checkDocumentAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "Entrepreneur") {
      return next(
        createHttpError(403, "Only entrepreneurs can upload documents")
      );
    }

    const restrictions = await getUserSubscriptionRestrictions(userId);

    // Document uploads are now allowed for all plans
    // if (!restrictions.documentsAllowed) {
    //   return next(
    //     createHttpError(
    //       403,
    //       `Document uploads are only available for Premium plan subscribers. Please upgrade your plan to upload documents.`
    //     )
    //   );
    // }

    req.subscriptionRestrictions = restrictions;
    next();
  } catch (error) {
    console.error("Error checking document access:", error);
    return next(createHttpError(500, "Error checking document access"));
  }
};

// Middleware to add subscription restrictions to request
export const addSubscriptionRestrictions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (userId) {
      const restrictions = await getUserSubscriptionRestrictions(userId);
      req.subscriptionRestrictions = restrictions;
    }
    next();
  } catch (error) {
    console.error("Error adding subscription restrictions:", error);
    next(); // Continue without restrictions if error
  }
};

// Helper function to filter pitches by subscription visibility rules
export const filterPitchesBySubscription = async (
  pitches: PitchDocument[],
  viewerUserId?: string,
  viewerCountry?: string
): Promise<PitchDocument[]> => {
  if (!viewerUserId) {
    // For anonymous users, show all global visibility pitches
    return pitches.filter((pitch) => {
      const user = pitch.userId;
      return (
        user?.subscriptionPlan === "Premium" ||
        user?.subscriptionPlan === "Investor Access Plan"
      );
    });
  }

  // Check if viewer has active subscription
  const hasActiveSubscription = await checkUserActiveSubscription(viewerUserId);
  const viewerUser = await getUserInfo(viewerUserId);

  if (viewerUser?.role === "Investor") {
    // For investors without active subscription - show only local pitches
    if (!hasActiveSubscription) {
      console.log(
        "🚫 Investor has no active subscription, showing local pitches only"
      );
      return pitches.filter((pitch) => {
        const pitchCountry = pitch.companyInfo?.country;
        return pitchCountry === viewerCountry;
      });
    }

    // For investors with active subscription - double check if they actually have Investor Access Plan
    // This provides extra protection in case User.subscriptionPlan wasn't updated immediately
    if (viewerUser && hasActiveSubscription) {
      // Simplified check: primarily rely on User.subscriptionPlan (updated immediately after purchase)
      const isInvestorAccessPlan =
        viewerUser.subscriptionPlan === "Investor Access Plan";

      if (isInvestorAccessPlan) {
        console.log(
          "✅ Verified Investor Access Plan via User.subscriptionPlan - showing all pitches globally"
        );
        return pitches;
      } else {
        console.log(
          "🚫 Investor has active subscription but not Investor Access Plan - showing local pitches only"
        );
        return pitches.filter((pitch) => {
          const pitchCountry = pitch.companyInfo?.country;
          return pitchCountry === viewerCountry;
        });
      }
    }

    // For investors with active subscription - show all pitches (fallback)
    console.log("✅ Investor has active subscription, showing all pitches");
    return pitches;
  }

  const viewerRestrictions = await getUserSubscriptionRestrictions(
    viewerUserId
  );

  if (viewerRestrictions.investorAccessGlobal) {
    // Premium users can see all pitches
    return pitches;
  }

  // Basic users can only see pitches from their country
  return pitches.filter((pitch) => {
    const pitchCountry = pitch.companyInfo?.country;
    const user = pitch.userId;

    // Show premium pitches globally
    if (user?.subscriptionPlan === "Premium") {
      return true;
    }

    // Show basic pitches only from same country
    return pitchCountry === viewerCountry;
  });
};

// Helper function to check if user has active subscription
const checkUserActiveSubscription = async (
  userId: string
): Promise<boolean> => {
  try {
    const userSubscription = await UserSubscription.findOne({
      user: userId,
      active: true,
      status: { $in: ["active", "trialing"] },
      currentPeriodEnd: { $gt: new Date() },
    });

    return !!userSubscription;
  } catch (error) {
    console.error("❌ Error checking user active subscription:", error);
    return false;
  }
};

// Helper function to get user info
const getUserInfo = async (userId: string) => {
  try {
    const user = await User.findById(userId).select("role");
    return user;
  } catch (error) {
    console.error("❌ Error getting user info:", error);
    return null;
  }
};

// Helper function to filter investors by subscription rules
export const filterInvestorsBySubscription = async (
  investors: DatabaseDocument[],
  entrepreneurUserId: string,
  entrepreneurCountry?: string
): Promise<DatabaseDocument[]> => {
  const entrepreneurRestrictions = await getUserSubscriptionRestrictions(
    entrepreneurUserId
  );

  if (entrepreneurRestrictions.investorAccessGlobal) {
    // Premium entrepreneurs can see all investors
    return investors;
  }

  // Basic entrepreneurs can only see investors from their region/country
  return investors.filter((investor) => {
    const investorCountry = investor.countryName;
    return investorCountry === entrepreneurCountry;
  });
};

// Extend AuthRequest interface to include subscription data
declare module "express-serve-static-core" {
  interface Request {
    subscriptionRestrictions?: SubscriptionRestrictions;
    publishedPitchesCount?: number;
  }
}

export default {
  checkPitchLimit,
  checkDocumentAccess,
  addSubscriptionRestrictions,
  getUserSubscriptionRestrictions,
  getUserSubscriptionData,
  filterPitchesBySubscription,
  filterInvestorsBySubscription,
};
