"use client";

import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useSubscriptionPlans,
  useCreateCheckout,
  useSubscriptionLogic,
  useSubscriptionStatus,
} from "@/hooks/subscription/useSubscription";
import { useCancelSubscriptionWithDialog } from "@/hooks/subscription/useCancelSubscription";
import CancelSubscriptionDialog from "@/components/subscription/CancelSubscriptionDialog";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthUser } from "@/hooks/auth/useAuthUser";

interface PricingPlansProps {
  userType?: "entrepreneur" | "investor";
  selectedPlan?: string;
  onPlanSelect?: (planId: string) => void;
  showRadioButtons?: boolean;
}

interface SubscriptionPlan {
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
    stripeId?: string;
  }[];
}

export default function PricingPlans({
  userType = "entrepreneur",
  selectedPlan,
  onPlanSelect,
  showRadioButtons = false,
}: PricingPlansProps) {
  const { data: entrepreneurPlans, isLoading: isLoadingEntrepreneur } =
    useSubscriptionPlans("entrepreneur");
  const { data: investorPlans, isLoading: isLoadingInvestor } =
    useSubscriptionPlans("investor");
  const { mutate: createCheckout, isPending: isCreatingCheckout } =
    useCreateCheckout();
  const {
    getRestrictionMessage,
    currentSubscription,
    isSubscriptionCancelled,
  } = useSubscriptionLogic();
  const {
    isDialogOpen,
    cancelData,
    isPending: isCanceling,
    handleCancelClick,
    handleConfirmCancel,
    handleDialogClose,
    updateCancelData,
  } = useCancelSubscriptionWithDialog();

  // Get subscription status including published pitch count and role
  const { data: subscriptionStatus } = useSubscriptionStatus();
  const { isAuthenticated, user } = useAuthUser();
  const effectiveUserType = isAuthenticated
    ? user?.role === "Investor"
      ? "investor"
      : "entrepreneur"
    : userType;

  const handlePlanSelect = (plan: SubscriptionPlan, priceId: string) => {
    if (showRadioButtons && onPlanSelect) {
      onPlanSelect(priceId);
      return;
    }

    // Check if user has an active subscription (prevent multiple subscriptions)
    if (
      currentSubscription &&
      currentSubscription.status === "active" &&
      !isSubscriptionCancelled
    ) {
      toast.error(
        "You already have an active subscription. Please cancel your current subscription before purchasing a new one.",
        {
          description:
            "You can manage your subscription in your account settings.",
          duration: 5000,
        }
      );
      return;
    }

    // Check for upgrade/downgrade restrictions for cancelled subscriptions still active
    if (currentSubscription && isSubscriptionCancelled) {
      const restrictionMessage = getRestrictionMessage(plan.name);
      if (restrictionMessage) {
        toast.error(restrictionMessage);
        return;
      }
    }

    // Create checkout session
    createCheckout(priceId);
  };

  const renderPlans = (
    plans: SubscriptionPlan[] | undefined,
    isLoading: boolean
  ) => {
    if (isLoading) {
      return (
        <div className="w-full flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (!plans || plans.length === 0) {
      return (
        <Alert>
          <AlertDescription>
            No subscription plans available at the moment.
          </AlertDescription>
        </Alert>
      );
    }

    const content = (
      <div
        className={cn(
          "grid gap-6",
          plans.length > 2
            ? "grid-cols-1 md:grid-cols-3"
            : "grid-cols-1 md:grid-cols-2"
        )}
      >
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    );

    // When using radio buttons, ensure RadioGroup context wraps the items
    if (showRadioButtons && selectedPlan !== undefined) {
      return (
        <RadioGroup value={selectedPlan} onValueChange={onPlanSelect}>
          {content}
        </RadioGroup>
      );
    }

    return content;
  };

  const PlanCard = ({ plan }: { plan: SubscriptionPlan }) => {
    const mainPrice = plan.prices?.[0];
    if (!mainPrice) return null;

    const isPopular = plan.name === "Premium";
    const isCurrentPlan =
      currentSubscription?.planName === plan.name && !isSubscriptionCancelled;
    const baseRestrictionMessage = getRestrictionMessage(plan.name);
    let restrictionMessage: string | null = baseRestrictionMessage;

    // Additional restriction: Entrepreneurs with >1 published pitches cannot select Basic
    const publishedCount = subscriptionStatus?.pitchUsage?.published || 0;
    const isEntrepreneur = subscriptionStatus?.user?.role === "Entrepreneur";
    const basicDisabledByPitches =
      isEntrepreneur && plan.name === "Basic" && publishedCount > 1;

    if (basicDisabledByPitches) {
      restrictionMessage =
        "You have more than one published pitch. You cannot purchase the Basic plan. Please choose Premium.";
    }

    const isRestricted = !!restrictionMessage;

    const hasActiveSubscriptionDifferentPlan = !!(
      currentSubscription &&
      currentSubscription.status === "active" &&
      !isSubscriptionCancelled &&
      currentSubscription.planName !== plan.name
    );

    const isButtonDisabled =
      isRestricted || isCreatingCheckout || hasActiveSubscriptionDifferentPlan;

    return (
      <div className="relative">
        <label>
          <div
            className={cn(
              "relative overflow-hidden border dark:border-slate-800 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg flex flex-col rounded-lg h-full p-4",
              isPopular && "border-2 border-primary/20 dark:border-primary/30",
              selectedPlan === mainPrice.id &&
                "ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900",
              isRestricted && "opacity-75"
            )}
          >
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-5",
                isPopular
                  ? "from-primary via-primary/50 to-primary/10"
                  : "from-slate-400 to-slate-100 dark:from-slate-800 dark:to-slate-900"
              )}
            />
            {showRadioButtons && (
              <RadioGroupItem
                value={mainPrice.id}
                id={mainPrice.id}
                className="sr-only"
                disabled={isRestricted}
              />
            )}
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold">
                  {plan.name}
                </CardTitle>
                {isPopular && (
                  <Badge
                    variant="default"
                    className="bg-primary text-black font-medium"
                  >
                    Most Popular
                  </Badge>
                )}
                {isCurrentPlan && (
                  <Badge variant="secondary" className="ml-2">
                    Current Plan
                  </Badge>
                )}
              </div>
              <CardDescription className="text-base mt-2">
                {plan.subtitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-6 flex-grow">
              <div>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">
                    ${mainPrice.amount}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    /{mainPrice.interval}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {plan.features.map((feature: string, i: number) => (
                  <div key={i} className="flex items-start">
                    <div className="rounded-full p-1 bg-primary/10 text-primary mr-3 mt-0.5">
                      <Check className="h-4 w-4" />
                    </div>
                    <span className="text-base">{feature}</span>
                  </div>
                ))}
              </div>

              {isRestricted && (
                <Alert className="mt-4">
                  <AlertDescription className="text-sm">
                    {restrictionMessage}
                  </AlertDescription>
                </Alert>
              )}

              {hasActiveSubscriptionDifferentPlan && (
                <Alert className="mt-4 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                  <AlertDescription className="text-sm text-orange-700 dark:text-orange-300">
                    You have an active {currentSubscription?.planName}{" "}
                    subscription. Cancel your current subscription to purchase
                    this plan.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="relative mt-6">
              {isCurrentPlan ? (
                <div className="w-full space-y-3">
                  <Button
                    type="button"
                    className="w-full font-medium h-12 text-lg bg-green-600 hover:bg-green-700 text-white"
                    disabled
                  >
                    Current Plan
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full font-medium bg-primary dark:bg-primary text-white dark:text-black dark:hover:bg-primary/80 py-6"
                    onClick={handleCancelClick}
                    disabled={isCanceling}
                  >
                    {isCanceling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Canceling...
                      </>
                    ) : (
                      <>
                        <X className="mr-2 h-4 w-4 " />
                        Cancel Subscription
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  className={cn(
                    "w-full font-medium h-12 text-lg",
                    selectedPlan === mainPrice.id
                      ? "bg-primary hover:bg-primary/90 text-black"
                      : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-200 dark:hover:bg-slate-300 dark:text-black",
                    hasActiveSubscriptionDifferentPlan &&
                      "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => handlePlanSelect(plan, mainPrice.id)}
                  disabled={isButtonDisabled}
                >
                  {isCreatingCheckout ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : hasActiveSubscriptionDifferentPlan ? (
                    "Active Subscription Required"
                  ) : selectedPlan === mainPrice.id ? (
                    "Selected"
                  ) : (
                    `Select ${plan.name}`
                  )}
                </Button>
              )}
            </CardFooter>
          </div>
        </label>
      </div>
    );
  };

  // If user is authenticated, ALWAYS show role-scoped plans (never show tabs)
  if (isAuthenticated) {
    return (
      <>
        {effectiveUserType === "entrepreneur"
          ? renderPlans(entrepreneurPlans, isLoadingEntrepreneur)
          : renderPlans(investorPlans, isLoadingInvestor)}

        {/* Cancel Subscription Dialog */}
        <CancelSubscriptionDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          onConfirm={handleConfirmCancel}
          isPending={isCanceling}
          cancelData={cancelData}
          updateCancelData={updateCancelData}
          planName={currentSubscription?.planName}
        />
      </>
    );
  }

  // Show tabs ONLY for unauthenticated users to grab attention
  return (
    <Tabs defaultValue="entrepreneur" className="w-full">
      <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
        <TabsTrigger value="entrepreneur">For Entrepreneurs</TabsTrigger>
        <TabsTrigger value="investor">For Investors</TabsTrigger>
      </TabsList>
      <TabsContent value="entrepreneur" className="mt-0">
        {renderPlans(entrepreneurPlans, isLoadingEntrepreneur)}
      </TabsContent>
      <TabsContent value="investor" className="mt-0">
        {renderPlans(investorPlans, isLoadingInvestor)}
      </TabsContent>

      {/* Cancel Subscription Dialog */}
      <CancelSubscriptionDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onConfirm={handleConfirmCancel}
        isPending={isCanceling}
        cancelData={cancelData}
        updateCancelData={updateCancelData}
        planName={currentSubscription?.planName}
      />
    </Tabs>
  );
}
