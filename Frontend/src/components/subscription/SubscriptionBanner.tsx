"use client";

import React from "react";
import { useSubscriptionAccess } from "@/hooks/subscription/useSubscription";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  AlertTriangle,
  CheckCircle,
  Globe,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SubscriptionBannerProps {
  showDetails?: boolean;
}

export function SubscriptionBanner({
  showDetails = false,
}: SubscriptionBannerProps) {
  const { isBasicPlan, isPremiumPlan, pitchUsage, isLoading } =
    useSubscriptionAccess();
  const router = useRouter();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-12 rounded"></div>;
  }

  if (isPremiumPlan) {
    return (
      <Alert className="border-success/20 bg-success/10 text-success-foreground">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-success" />
            <span className="font-medium">Premium Plan Active</span>
            <Badge className="border-transparent bg-success text-success-foreground">
              Premium
            </Badge>
          </div>
          {showDetails && (
            <span className="text-sm">All features unlocked</span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (isBasicPlan) {
    const isNearLimit = pitchUsage.published / pitchUsage.limit >= 0.8;

    return (
      <Alert className="border-warning/20 bg-warning/10 text-warning-foreground">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">Basic Plan</span>
            <Badge variant="outline">Free</Badge>
            {isNearLimit && (
              <Badge
                variant="destructive"
                className="border-transparent bg-warning text-warning-foreground"
              >
                {pitchUsage.remaining} pitches left
              </Badge>
            )}
          </div>
          <Button size="sm" onClick={() => router.push("/pricing")}>
            <Crown className="h-4 w-4 mr-1" />
            Upgrade
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

export function FeatureAccessBanner({ feature }: { feature: string }) {
  const { checkFeatureAccess, getFeatureRestrictionMessage } =
    useSubscriptionAccess();
  const router = useRouter();

  const hasAccess = checkFeatureAccess(feature);
  const message = getFeatureRestrictionMessage(feature);

  if (hasAccess) {
    return null;
  }

  const getFeatureInfo = (feature: string) => {
    switch (feature) {
      case "documents":
        return {
          icon: <FileText className="h-4 w-4" />,
          title: "Document Uploads",
          description: "Upload business plans and financial documents",
        };
      case "global-visibility":
        return {
          icon: <Globe className="h-4 w-4" />,
          title: "Global Visibility",
          description: "Show your pitches to investors worldwide",
        };
      default:
        return {
          icon: <Crown className="h-4 w-4" />,
          title: "Premium Feature",
          description: "This feature requires a Premium subscription",
        };
    }
  };

  const featureInfo = getFeatureInfo(feature);

  return (
    <Alert className="border-warning/20 bg-warning/10 text-warning-foreground">
      {featureInfo.icon}
      <AlertDescription className="flex items-center justify-between">
        <div>
          <p className="font-medium flex items-center gap-2">
            {featureInfo.title}
            <Badge className="border-transparent bg-warning text-warning-foreground">
              Premium
            </Badge>
          </p>
          <p className="mt-1 text-sm">{message || featureInfo.description}</p>
        </div>
        <Button size="sm" onClick={() => router.push("/pricing")}>
          Upgrade
        </Button>
      </AlertDescription>
    </Alert>
  );
}
