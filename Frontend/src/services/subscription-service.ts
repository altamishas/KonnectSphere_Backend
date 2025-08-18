import axios from "@/lib/axios";

export interface SubscriptionPlan {
  id: string;
  name: string;
  subtitle: string;
  userType: "entrepreneur" | "investor";
  pitchLimit: number;
  globalVisibility: boolean;
  features: string[];
  prices: {
    id: string;
    amount: number;
    currency: string;
    interval: "month" | "year";
    stripeId: string;
  }[];
}

export interface UserSubscription {
  planName: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  pitchesUsed: number;
  pitchesRemaining: number;
  canAddPitch: boolean;
  cancelAtPeriodEnd: boolean;
}

export interface PaymentHistory {
  _id: string;
  stripeInvoiceId: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed" | "cancelled";
  description: string;
  invoiceUrl?: string;
  paidAt?: string;
  dueDate?: string;
  createdAt: string;
}

export interface CurrentInvoice {
  id: string;
  amount: number;
  currency: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  status: string;
}

export interface CheckoutSessionResponse {
  success: boolean;
  checkoutUrl: string;
  sessionId: string;
}

export interface SubscriptionError {
  response?: {
    data?: {
      message?: string;
      stack?: string;
    };
    status?: number;
  };
  message?: string;
}

export interface SubscriptionStatus {
  user: {
    id: string;
    fullName: string;
    role: string;
    subscriptionPlan: string;
    countryName: string;
  };
  subscription:
    | (UserSubscription & { userType?: "entrepreneur" | "investor" })
    | null;
  pitchUsage: {
    published: number;
    limit: number;
    remaining: number;
    canAddMore: boolean;
  };
  features: {
    globalVisibility: boolean;
    documentsAllowed: boolean;
    investorAccessGlobal: boolean;
    featuredInSearch: boolean;
  };
}

export const subscriptionService = {
  // Get all subscription plans
  getPlans: async (
    userType?: "entrepreneur" | "investor"
  ): Promise<SubscriptionPlan[]> => {
    try {
      const params = userType ? { userType } : {};
      const response = await axios.get("/subscriptions/plans", { params });
      return response.data.plans;
    } catch (err) {
      const error = err as SubscriptionError;
      throw error;
    }
  },

  // Get current user subscription
  getCurrentSubscription: async (): Promise<UserSubscription | null> => {
    try {
      const response = await axios.get("/subscriptions/current");
      return response.data.subscription;
    } catch (err) {
      const error = err as SubscriptionError;
      throw error;
    }
  },

  // Create checkout session
  createCheckoutSession: async (
    priceId: string
  ): Promise<CheckoutSessionResponse> => {
    try {
      const response = await axios.post("/subscriptions/checkout", { priceId });
      return response.data;
    } catch (err) {
      const error = err as SubscriptionError;
      throw error;
    }
  },

  // Handle successful payment
  handleSuccessfulPayment: async (
    sessionId: string
  ): Promise<UserSubscription> => {
    try {
      const response = await axios.post("/subscriptions/success", {
        sessionId,
      });
      return response.data.subscription;
    } catch (err) {
      const error = err as SubscriptionError;
      throw error;
    }
  },

  // Cancel subscription
  cancelSubscription: async (data: {
    reason?: string;
    feedback?: string;
    immediate?: boolean;
  }): Promise<{ message: string; subscription: UserSubscription }> => {
    try {
      const response = await axios.post("/subscriptions/cancel", data);
      return response.data;
    } catch (err) {
      const error = err as SubscriptionError;
      throw error;
    }
  },

  // Refresh subscription data
  refreshSubscription: async (): Promise<UserSubscription> => {
    try {
      const response = await axios.post("/subscriptions/refresh");
      return response.data.subscription;
    } catch (err) {
      const error = err as SubscriptionError;
      throw error;
    }
  },

  // Get payment history
  getPaymentHistory: async (
    params: {
      limit?: number;
      page?: number;
      year?: string;
      status?: string;
    } = {}
  ): Promise<{
    payments: PaymentHistory[];
    total: number;
    page: number;
    limit: number;
  }> => {
    try {
      const response = await axios.get("/subscriptions/payments", { params });
      return response.data;
    } catch (err) {
      const error = err as SubscriptionError;
      throw error;
    }
  },

  // Get current invoice
  getCurrentInvoice: async (): Promise<CurrentInvoice> => {
    try {
      const response = await axios.get("/subscriptions/current-invoice");
      return response.data.invoice;
    } catch (err) {
      const error = err as SubscriptionError;
      throw error;
    }
  },

  // Get detailed subscription status with usage and features
  getSubscriptionStatus: async (): Promise<SubscriptionStatus> => {
    try {
      const response = await axios.get("/subscriptions/status");
      return response.data.data;
    } catch (err) {
      const error = err as SubscriptionError;
      throw error;
    }
  },

  // Check if user can upgrade to premium
  canUpgradeToPremium: (
    currentSubscription: UserSubscription | null
  ): boolean => {
    if (!currentSubscription) return true;

    // If current plan is Basic and period hasn't ended, cannot upgrade
    if (currentSubscription.planName === "Basic") {
      const currentPeriodEnd = new Date(currentSubscription.currentPeriodEnd);
      const now = new Date();
      return now >= currentPeriodEnd;
    }

    return false;
  },

  // Check if user can downgrade to basic
  canDowngradeToBasic: (
    currentSubscription: UserSubscription | null
  ): boolean => {
    if (!currentSubscription) return false;

    // Premium users cannot downgrade during active period
    if (currentSubscription.planName === "Premium") {
      return false;
    }

    return true;
  },

  // Get subscription upgrade/downgrade restrictions message
  getUpgradeRestrictionMessage: (
    currentSubscription: UserSubscription | null,
    targetPlan: string
  ): string | null => {
    if (!currentSubscription) return null;

    if (currentSubscription.planName === "Premium" && targetPlan === "Basic") {
      return "Cannot downgrade from Premium to Basic during active subscription period. You can cancel your Premium subscription and subscribe to Basic after the current period ends.";
    }

    if (currentSubscription.planName === "Basic" && targetPlan === "Premium") {
      const currentPeriodEnd = new Date(currentSubscription.currentPeriodEnd);
      const now = new Date();

      if (now < currentPeriodEnd) {
        return `Cannot upgrade to Premium until your current Basic subscription period ends on ${currentPeriodEnd.toLocaleDateString()}. You can upgrade after this date.`;
      }
    }

    return null;
  },

  // Check if user can add another pitch
  canAddPitch: (subscription: UserSubscription | null): boolean => {
    if (!subscription) return false;
    return subscription.canAddPitch || false;
  },

  // Get remaining pitches count
  getRemainingPitches: (subscription: UserSubscription | null): number => {
    if (!subscription) return 0;
    return subscription.pitchesRemaining || 0;
  },

  // Get restriction message for feature access
  getRestrictionMessage: (
    currentSubscription: UserSubscription | null,
    targetFeature: string
  ): string | null => {
    // For subscription plan names (Basic, Premium), allow new users to purchase
    if (
      !currentSubscription &&
      (targetFeature === "Basic" ||
        targetFeature === "Premium" ||
        targetFeature === "Investor Access Plan")
    ) {
      return null; // New users can always purchase their first subscription
    }

    // For other features, require subscription
    if (!currentSubscription) {
      return "Please subscribe to access this feature";
    }

    const planName = currentSubscription.planName;

    switch (targetFeature) {
      case "documents":
        if (planName === "Free") {
          return "Document uploads require a subscription plan. Please upgrade to Basic or Premium.";
        }
        // Document uploads are available for all paid plans
        break;
      case "global-visibility":
        if (planName !== "Premium") {
          return "Global pitch visibility is only available for Premium subscribers. Your pitches will only be visible in your region.";
        }
        break;
      case "global-investors":
        if (planName !== "Premium") {
          return "Access to global investors is only available for Premium subscribers. You can only see investors in your region.";
        }
        break;
      case "additional-pitch":
        if (planName === "Free") {
          return "Publishing pitches requires a subscription plan. Please upgrade to Basic or Premium to publish pitches.";
        }
        if (planName === "Basic" && !currentSubscription.canAddPitch) {
          return "You have reached your pitch limit. Please upgrade to Premium to publish more pitches.";
        }
        if (planName === "Premium" && !currentSubscription.canAddPitch) {
          return "You have reached your pitch limit of 5. Please delete an existing pitch to publish a new one.";
        }
        break;
      default:
        break;
    }

    return null;
  },

  // Check feature access based on subscription
  checkFeatureAccess: (
    subscription: UserSubscription | null,
    feature: string
  ): boolean => {
    if (!subscription) return false;

    const planName = subscription.planName;

    switch (feature) {
      case "documents":
        return planName === "Premium";
      case "global-visibility":
        return planName === "Premium";
      case "global-investors":
        return planName === "Premium";
      case "featured-search":
        return planName === "Premium";
      case "multiple-pitches":
        return planName === "Premium";
      default:
        return true;
    }
  },

  // Get feature descriptions for plans
  getFeatureDescription: (feature: string): string => {
    const descriptions: Record<string, string> = {
      documents: "Upload business plans, financials, and supporting documents",
      "global-visibility":
        "Your pitches are visible worldwide to all investors",
      "global-investors": "Access to investors from all countries and regions",
      "featured-search": "Your pitches appear at the top of search results",
      "multiple-pitches": "Publish up to 5 business pitches",
      "regional-only": "Pitches visible only in your selected country/region",
      "basic-support": "Standard customer support",
      "priority-support":
        "Priority customer support with faster response times",
    };

    return descriptions[feature] || "Feature description not available";
  },
};
