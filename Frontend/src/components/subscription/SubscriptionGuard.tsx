"use client";

import React from "react";
import { useSubscriptionAccess } from "@/hooks/subscription/useSubscription";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock, Zap, Globe, FileText, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface SubscriptionGuardProps {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  showUpgrade?: boolean;
}

export function SubscriptionGuard({
  feature,
  fallback,
  children,
  showUpgrade = true,
}: SubscriptionGuardProps) {
  const { checkFeatureAccess, getFeatureRestrictionMessage, isLoading } =
    useSubscriptionAccess();
  const router = useRouter();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-20 rounded"></div>;
  }

  const hasAccess = checkFeatureAccess(feature);
  const restrictionMessage = getFeatureRestrictionMessage(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgrade) {
    return null;
  }

  return (
    <UpgradePrompt
      feature={feature}
      message={restrictionMessage}
      onUpgrade={() => router.push("/pricing")}
    />
  );
}

interface UpgradePromptProps {
  feature: string;
  message: string | null;
  onUpgrade: () => void;
  variant?: "card" | "alert" | "inline";
}

export function UpgradePrompt({
  feature,
  message,
  onUpgrade,
  variant = "card",
}: UpgradePromptProps) {
  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case "documents":
        return <FileText className="h-6 w-6" />;
      case "global-visibility":
        return <Globe className="h-6 w-6" />;
      case "global-investors":
        return <Users className="h-6 w-6" />;
      case "featured-search":
        return <Zap className="h-6 w-6" />;
      default:
        return <Crown className="h-6 w-6" />;
    }
  };

  const getFeatureTitle = (feature: string) => {
    switch (feature) {
      case "documents":
        return "Document Uploads";
      case "global-visibility":
        return "Global Visibility";
      case "global-investors":
        return "Global Investor Access";
      case "featured-search":
        return "Featured Search Results";
      case "additional-pitch":
        return "Additional Pitches";
      default:
        return "Premium Feature";
    }
  };

  if (variant === "alert") {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <Lock className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            {message || "This feature requires a Premium subscription."}
          </span>
          <Button size="sm" onClick={onUpgrade} className="ml-4">
            Upgrade Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
        <Lock className="h-4 w-4 text-orange-600" />
        <span className="text-sm text-orange-800 flex-1">
          {message || "Premium feature"}
        </span>
        <Button size="sm" variant="outline" onClick={onUpgrade}>
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-2">
          {getFeatureIcon(feature)}
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Crown className="h-5 w-5 text-orange-600" />
          {getFeatureTitle(feature)}
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Premium
          </Badge>
        </CardTitle>
        <CardDescription>
          {message || "This feature is available with a Premium subscription."}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button onClick={onUpgrade} className="w-full">
          <Crown className="h-4 w-4 mr-2" />
          Upgrade to Premium
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          Unlock all premium features and grow your business faster
        </p>
      </CardContent>
    </Card>
  );
}

interface PitchLimitIndicatorProps {
  className?: string;
}

export function PitchLimitIndicator({ className }: PitchLimitIndicatorProps) {
  const { pitchUsage, isLoading } = useSubscriptionAccess();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 rounded"></div>;
  }

  const percentage = (pitchUsage.published / pitchUsage.limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = pitchUsage.remaining === 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Pitch Usage</span>
        <span
          className={
            isAtLimit
              ? "text-red-600"
              : isNearLimit
              ? "text-orange-600"
              : "text-gray-600"
          }
        >
          {pitchUsage.published} / {pitchUsage.limit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            isAtLimit
              ? "bg-red-500"
              : isNearLimit
              ? "bg-orange-500"
              : "bg-green-500"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {isAtLimit && (
        <p className="text-xs text-red-600">
          You&apos;ve reached your pitch limit. Upgrade to publish more pitches.
        </p>
      )}
      {isNearLimit && !isAtLimit && (
        <p className="text-xs text-orange-600">
          You&apos;re approaching your pitch limit. Consider upgrading soon.
        </p>
      )}
    </div>
  );
}

interface FeatureBadgeProps {
  feature: string;
  children: React.ReactNode;
  showTooltip?: boolean;
}

export function FeatureBadge({
  feature,
  children,
  showTooltip = true,
}: FeatureBadgeProps) {
  const { checkFeatureAccess } = useSubscriptionAccess();
  const hasAccess = checkFeatureAccess(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative group">
      <div className="opacity-50 pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Badge
          variant="secondary"
          className="bg-orange-100 text-orange-800 text-xs"
        >
          <Crown className="h-3 w-3 mr-1" />
          Premium
        </Badge>
      </div>
      {showTooltip && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          Premium feature
        </div>
      )}
    </div>
  );
}
