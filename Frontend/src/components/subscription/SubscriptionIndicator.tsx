"use client";

import React from "react";
import { useSubscriptionAccess } from "@/hooks/subscription/useSubscription";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface SubscriptionIndicatorProps {
  showUpgrade?: boolean;
  variant?: "badge" | "button" | "full";
}

export function SubscriptionIndicator({
  showUpgrade = true,
  variant = "badge",
}: SubscriptionIndicatorProps) {
  const { isBasicPlan, isPremiumPlan, pitchUsage, isLoading } =
    useSubscriptionAccess();
  const router = useRouter();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>;
  }

  if (variant === "badge") {
    if (isPremiumPlan) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <Crown className="h-3 w-3 mr-1" />
          Premium
        </Badge>
      );
    }

    if (isBasicPlan) {
      const isAtLimit = pitchUsage.remaining === 0;
      return (
        <Badge variant={isAtLimit ? "destructive" : "secondary"}>
          {isAtLimit && <AlertCircle className="h-3 w-3 mr-1" />}
          Basic
        </Badge>
      );
    }
  }

  if (variant === "button") {
    if (isPremiumPlan) {
      return (
        <Button variant="outline" size="sm" disabled className="cursor-default">
          <Crown className="h-4 w-4 mr-2" />
          Premium
        </Button>
      );
    }

    if (isBasicPlan && showUpgrade) {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/pricing")}
        >
          <Crown className="h-4 w-4 mr-2" />
          Upgrade
        </Button>
      );
    }
  }

  if (variant === "full") {
    if (isPremiumPlan) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <Crown className="h-4 w-4 text-green-600" />
          <span className="font-medium">Premium Plan</span>
          <Badge className="bg-green-100 text-green-800">Active</Badge>
        </div>
      );
    }

    if (isBasicPlan) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Basic Plan</span>
          <Badge variant="outline">
            {pitchUsage.published}/{pitchUsage.limit} pitches
          </Badge>
          {showUpgrade && (
            <Button size="sm" onClick={() => router.push("/pricing")}>
              Upgrade
            </Button>
          )}
        </div>
      );
    }
  }

  return null;
}

export function PitchUsageIndicator() {
  const { pitchUsage, isLoading } = useSubscriptionAccess();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>;
  }

  const isAtLimit = pitchUsage.remaining === 0;
  const isNearLimit = pitchUsage.published / pitchUsage.limit >= 0.8;

  return (
    <Badge
      variant={
        isAtLimit ? "destructive" : isNearLimit ? "default" : "secondary"
      }
      className="text-xs"
    >
      {isAtLimit && <AlertCircle className="h-3 w-3 mr-1" />}
      {pitchUsage.published}/{pitchUsage.limit} pitches
    </Badge>
  );
}

// Compact version for header usage
export function PitchUsageIndicatorCompact() {
  const { pitchUsage, isLoading } = useSubscriptionAccess();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>;
  }

  const isAtLimit = pitchUsage.remaining === 0;
  const isNearLimit = pitchUsage.published / pitchUsage.limit >= 0.8;

  return (
    <Badge
      variant={
        isAtLimit ? "destructive" : isNearLimit ? "default" : "secondary"
      }
      className="text-xs px-2 py-1"
    >
      {isAtLimit && <AlertCircle className="h-3 w-3 mr-1" />}
      {pitchUsage.published}/{pitchUsage.limit}
    </Badge>
  );
}
