import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { subscriptionService } from "@/services/subscription-service";
import { useAuthUser } from "@/hooks/auth/useAuthUser";

// Query keys
export const SUBSCRIPTION_KEYS = {
  all: ["subscriptions"] as const,
  plans: (userType?: string) =>
    [...SUBSCRIPTION_KEYS.all, "plans", userType] as const,
  current: () => [...SUBSCRIPTION_KEYS.all, "current"] as const,
  status: () => [...SUBSCRIPTION_KEYS.all, "status"] as const,
  payments: (page?: number, limit?: number) =>
    [...SUBSCRIPTION_KEYS.all, "payments", page, limit] as const,
};

// Get subscription plans
export const useSubscriptionPlans = (
  userType?: "entrepreneur" | "investor"
) => {
  return useQuery({
    queryKey: SUBSCRIPTION_KEYS.plans(userType),
    queryFn: () => subscriptionService.getPlans(userType),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

// Get current user subscription
export const useCurrentSubscription = () => {
  const { user } = useAuthUser();

  return useQuery({
    queryKey: SUBSCRIPTION_KEYS.current(),
    queryFn: subscriptionService.getCurrentSubscription,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
};

// Create checkout session and redirect to Stripe
export const useCreateCheckout = () => {
  const { handleError } = useErrorHandler();
  return useMutation({
    mutationFn: subscriptionService.createCheckoutSession,
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      window.location.href = data.checkoutUrl;
    },
    onError: (error: unknown) => {
      handleError(error, "Failed to create checkout session");
    },
  });
};

// Handle successful payment
export const useHandlePaymentSuccess = () => {
  const { handleError, handleSuccess } = useErrorHandler();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subscriptionService.handleSuccessfulPayment,
    onSuccess: (data) => {
      // Invalidate subscription queries to get fresh data
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEYS.current() });
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });

      // Force refetch to ensure UI updates immediately
      queryClient.refetchQueries({ queryKey: SUBSCRIPTION_KEYS.current() });

      handleSuccess("Subscription activated successfully!");

      return data;
    },
    onError: (error: unknown) => {
      handleError(error, "Failed to process payment");
      throw error;
    },
  });
};

// Cancel subscription
export const useCancelSubscription = () => {
  const { handleError, handleSuccess } = useErrorHandler();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subscriptionService.cancelSubscription,
    onSuccess: (data) => {
      // Invalidate subscription queries
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEYS.current() });

      handleSuccess(data.message);
    },
    onError: (error: unknown) => {
      handleError(error, "Failed to cancel subscription");
    },
  });
};

// Refresh subscription
export const useRefreshSubscription = () => {
  const { handleError, handleSuccess } = useErrorHandler();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subscriptionService.refreshSubscription,
    onSuccess: (subscription) => {
      // Update subscription cache
      queryClient.setQueryData(SUBSCRIPTION_KEYS.current(), subscription);

      handleSuccess("Subscription refreshed successfully!");
    },
    onError: (error: unknown) => {
      handleError(error, "Failed to refresh subscription");
    },
  });
};

// Get payment history
export const usePaymentHistory = (
  page = 1,
  limit = 20,
  year?: string,
  status?: string
) => {
  const { user } = useAuthUser();

  return useQuery({
    queryKey: SUBSCRIPTION_KEYS.payments(page, limit),
    queryFn: () =>
      subscriptionService.getPaymentHistory({ page, limit, year, status }),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
};

// Get current invoice
export const useCurrentInvoice = () => {
  const { user } = useAuthUser();

  return useQuery({
    queryKey: [...SUBSCRIPTION_KEYS.current(), "invoice"],
    queryFn: subscriptionService.getCurrentInvoice,
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

// Get detailed subscription status with usage and features
export const useSubscriptionStatus = () => {
  const { user } = useAuthUser();

  return useQuery({
    queryKey: SUBSCRIPTION_KEYS.status(),
    queryFn: subscriptionService.getSubscriptionStatus,
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

// Enhanced subscription logic with access control
export const useSubscriptionAccess = () => {
  const { data: subscriptionStatus, isLoading } = useSubscriptionStatus();

  const isFreePlan = subscriptionStatus?.user.subscriptionPlan === "Free";
  const isBasicPlan = subscriptionStatus?.user.subscriptionPlan === "Basic";
  const isPremiumPlan = subscriptionStatus?.user.subscriptionPlan === "Premium";
  const isInvestorPlan =
    subscriptionStatus?.user.subscriptionPlan === "Investor Access Plan";

  // Feature access checks
  const canUploadDocuments = !isFreePlan; // Document uploads only for paid plans
  const hasGlobalVisibility =
    subscriptionStatus?.features.globalVisibility || false;
  const hasGlobalInvestorAccess =
    subscriptionStatus?.features.investorAccessGlobal || false;
  const hasFeaturedSearch =
    subscriptionStatus?.features.featuredInSearch || false;

  // Pitch usage data
  const pitchUsage = subscriptionStatus?.pitchUsage || {
    published: 0,
    limit: 1,
    remaining: 1,
    canAddMore: false,
  };

  // Access control methods
  const checkFeatureAccess = (feature: string): boolean => {
    if (!subscriptionStatus) return false;
    return subscriptionService.checkFeatureAccess(
      subscriptionStatus.subscription,
      feature
    );
  };

  const getFeatureRestrictionMessage = (feature: string): string | null => {
    if (!subscriptionStatus) return "Please subscribe to access this feature";
    return subscriptionService.getRestrictionMessage(
      subscriptionStatus.subscription,
      feature
    );
  };

  const requiresPremium = (feature: string): boolean => {
    return !checkFeatureAccess(feature) && (isFreePlan || isBasicPlan);
  };

  // User location data
  const userCountry = subscriptionStatus?.user.countryName;

  return {
    // Loading state
    isLoading,

    // User and subscription data
    user: subscriptionStatus?.user,
    subscription: subscriptionStatus?.subscription,

    // Plan checks
    isFreePlan,
    isBasicPlan,
    isPremiumPlan,
    isInvestorPlan,

    // Feature access
    canUploadDocuments,
    hasGlobalVisibility,
    hasGlobalInvestorAccess,
    hasFeaturedSearch,

    // Pitch usage
    pitchUsage,

    // Location
    userCountry,

    // Access control methods
    checkFeatureAccess,
    getFeatureRestrictionMessage,
    requiresPremium,

    // Raw data
    subscriptionStatus,
  };
};

// Hook for pitch-specific access control
export const usePitchAccess = () => {
  const {
    pitchUsage,
    canUploadDocuments,
    hasGlobalVisibility,
    getFeatureRestrictionMessage,
    isLoading,
  } = useSubscriptionAccess();

  const canPublishPitch = pitchUsage.canAddMore;
  const canUploadDocumentsToPitch = canUploadDocuments;

  const getPitchLimitMessage = (): string | null => {
    if (canPublishPitch) return null;
    return getFeatureRestrictionMessage("additional-pitch");
  };

  const getDocumentUploadMessage = (): string | null => {
    if (canUploadDocumentsToPitch) return null;
    return getFeatureRestrictionMessage("documents");
  };

  const getVisibilityMessage = (): string | null => {
    if (hasGlobalVisibility) return null;
    return getFeatureRestrictionMessage("global-visibility");
  };

  return {
    isLoading,
    canPublishPitch,
    canUploadDocumentsToPitch,
    hasGlobalVisibility,
    pitchUsage,
    getPitchLimitMessage,
    getDocumentUploadMessage,
    getVisibilityMessage,
  };
};

// Hook for investor access control
export const useInvestorAccess = () => {
  const {
    hasGlobalInvestorAccess,
    userCountry,
    getFeatureRestrictionMessage,
    isLoading,
  } = useSubscriptionAccess();

  const canAccessGlobalInvestors = hasGlobalInvestorAccess;

  const getInvestorAccessMessage = (): string | null => {
    if (canAccessGlobalInvestors) return null;
    return getFeatureRestrictionMessage("global-investors");
  };

  return {
    isLoading,
    canAccessGlobalInvestors,
    userCountry,
    getInvestorAccessMessage,
  };
};

// Custom hook for subscription business logic
export const useSubscriptionLogic = () => {
  const { data: currentSubscription } = useCurrentSubscription();

  const canUpgradeToPremium = subscriptionService.canUpgradeToPremium(
    currentSubscription || null
  );
  const canDowngradeToBasic = subscriptionService.canDowngradeToBasic(
    currentSubscription || null
  );
  const canAddPitch = subscriptionService.canAddPitch(
    currentSubscription || null
  );
  const remainingPitches = subscriptionService.getRemainingPitches(
    currentSubscription || null
  );

  const getRestrictionMessage = (targetPlan: string) => {
    return subscriptionService.getRestrictionMessage(
      currentSubscription || null,
      targetPlan
    );
  };

  const isSubscriptionActive =
    currentSubscription?.status === "active" ||
    currentSubscription?.status === "trialing";

  // Check if subscription is cancelled or inactive
  const isSubscriptionCancelled =
    currentSubscription?.status === "cancelled" ||
    currentSubscription?.status === "canceled" ||
    !isSubscriptionActive;

  const isBasicPlan =
    currentSubscription?.planName === "Basic" && isSubscriptionActive;
  const isPremiumPlan =
    currentSubscription?.planName === "Premium" && isSubscriptionActive;
  const isInvestorPlan =
    currentSubscription?.planName === "Investor Access Plan" &&
    isSubscriptionActive;

  const subscriptionEndDate = currentSubscription?.currentPeriodEnd
    ? new Date(currentSubscription.currentPeriodEnd)
    : null;

  const daysUntilRenewal = subscriptionEndDate
    ? Math.ceil(
        (subscriptionEndDate.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return {
    currentSubscription,
    canUpgradeToPremium,
    canDowngradeToBasic,
    canAddPitch,
    remainingPitches,
    getRestrictionMessage,
    isSubscriptionActive,
    isSubscriptionCancelled,
    isBasicPlan,
    isPremiumPlan,
    isInvestorPlan,
    subscriptionEndDate,
    daysUntilRenewal,
    hasActiveSubscription: !!currentSubscription && isSubscriptionActive,
  };
};

// Hook for handling subscription restrictions in forms/components
export const useSubscriptionGuard = () => {
  const { handleError } = useErrorHandler();
  const { currentSubscription, canAddPitch, remainingPitches } =
    useSubscriptionLogic();
  const router = useRouter();

  const checkPitchLimit = (showToast = true) => {
    if (!canAddPitch) {
      if (showToast) {
        if (remainingPitches === 0) {
          handleError(
            "You have reached your pitch limit. Please upgrade your plan to add more pitches."
          );
        } else {
          handleError("You cannot add more pitches with your current plan.");
        }
      }
      return false;
    }
    return true;
  };

  const requireSubscription = (
    requiredPlan?: string,
    redirectTo = "/pricing"
  ) => {
    if (
      !currentSubscription ||
      !currentSubscription.status ||
      !["active", "trialing"].includes(currentSubscription.status)
    ) {
      handleError("Please subscribe to a plan to access this feature.");
      router.push(redirectTo);
      return false;
    }

    if (requiredPlan && currentSubscription.planName !== requiredPlan) {
      handleError(`This feature requires a ${requiredPlan} subscription.`);
      router.push(redirectTo);
      return false;
    }

    return true;
  };

  return {
    checkPitchLimit,
    requireSubscription,
    currentSubscription,
    canAddPitch,
    remainingPitches,
  };
};
