"use client";

import React from "react";
import { usePitchAccess } from "@/hooks/subscription/useSubscription";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Crown,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  PitchLimitIndicator,
  UpgradePrompt,
} from "@/components/subscription/SubscriptionGuard";
import { cn } from "@/lib/utils";

interface PitchCreationGuardProps {
  children: React.ReactNode;
  showLimit?: boolean;
}

export function PitchCreationGuard({
  children,
  showLimit = true,
}: PitchCreationGuardProps) {
  const { canPublishPitch, getPitchLimitMessage, isLoading } = usePitchAccess();
  const router = useRouter();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded"></div>;
  }

  if (!canPublishPitch) {
    return (
      <Card className="border-destructive/20 bg-destructive/10 text-destructive-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Pitch Limit Reached
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{getPitchLimitMessage()}</p>
          <div className="space-y-4">
            <PitchLimitIndicator />
            <Button
              onClick={() => router.push("/pricing")}
              className="w-full"
              variant="destructive"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showLimit && <PitchUsageHeader />}
      {children}
    </div>
  );
}

export function PitchUsageHeader() {
  const { pitchUsage, isLoading } = usePitchAccess();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-16 rounded"></div>;
  }

  const percentage = (pitchUsage.published / pitchUsage.limit) * 100;
  const isNearLimit = percentage >= 80;

  return (
    <Card
      className={cn(
        isNearLimit
          ? "border-warning/20 bg-warning/10 text-warning-foreground"
          : "border-success/20 bg-success/10 text-success-foreground"
      )}
    >
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Pitch Usage
          </h3>
          <Badge
            variant={isNearLimit ? "destructive" : "secondary"}
            className={cn(
              isNearLimit
                ? "border-transparent bg-warning text-warning-foreground"
                : "border-transparent bg-success text-success-foreground"
            )}
          >
            {pitchUsage.published} / {pitchUsage.limit} used
          </Badge>
        </div>
        <Progress value={percentage} className="h-2 mb-2" />
        <p className="text-xs text-muted-foreground">
          {pitchUsage.remaining > 0
            ? `You can publish ${pitchUsage.remaining} more ${
                pitchUsage.remaining === 1 ? "pitch" : "pitches"
              }.`
            : "You have reached your pitch limit."}
        </p>
      </CardContent>
    </Card>
  );
}

interface DocumentUploadGuardProps {
  children: React.ReactNode;
  variant?: "block" | "disable";
}

export function DocumentUploadGuard({
  children,
  variant = "block",
}: DocumentUploadGuardProps) {
  const { canUploadDocumentsToPitch, getDocumentUploadMessage, isLoading } =
    usePitchAccess();
  const router = useRouter();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-20 rounded"></div>;
  }

  if (!canUploadDocumentsToPitch) {
    if (variant === "disable") {
      return (
        <div className="space-y-2">
          <div className="opacity-50 pointer-events-none">{children}</div>
          <Alert className="border-warning/20 bg-warning/10 text-warning-foreground">
            <Crown className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-sm">{getDocumentUploadMessage()}</span>
              <Button size="sm" onClick={() => router.push("/pricing")}>
                Upgrade
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return (
      <UpgradePrompt
        feature="documents"
        message={getDocumentUploadMessage()}
        onUpgrade={() => router.push("/pricing")}
        variant="card"
      />
    );
  }

  return <>{children}</>;
}

interface PitchVisibilityIndicatorProps {
  className?: string;
}

export function PitchVisibilityIndicator({
  className,
}: PitchVisibilityIndicatorProps) {
  const { hasGlobalVisibility, getVisibilityMessage } = usePitchAccess();
  const router = useRouter();

  if (hasGlobalVisibility) {
    return (
      <Alert
        className={`border-success/20 bg-success/10 text-success-foreground ${className}`}
      >
        <CheckCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-success" />
            <span className="font-medium">Global Visibility</span>
            <Badge className="border-transparent bg-success text-success-foreground">
              Premium
            </Badge>
          </div>
          <span className="text-sm">Your pitches are visible worldwide</span>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert
      className={`border-warning/20 bg-warning/10 text-warning-foreground ${className}`}
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <p className="font-medium">Regional Visibility Only</p>
          <p className="text-sm">{getVisibilityMessage()}</p>
        </div>
        <Button size="sm" onClick={() => router.push("/pricing")}>
          Upgrade
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function PitchPublishButton({
  onPublish,
  disabled = false,
  children = "Publish Pitch",
}: {
  onPublish: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const { canPublishPitch, getPitchLimitMessage } = usePitchAccess();
  const router = useRouter();

  if (!canPublishPitch) {
    return (
      <div className="space-y-2">
        <Button disabled className="w-full" variant="destructive">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Pitch Limit Reached
        </Button>
        <p className="text-xs text-center text-destructive">
          {getPitchLimitMessage()}
        </p>
        <Button
          onClick={() => router.push("/pricing")}
          className="w-full"
          size="sm"
        >
          <Crown className="h-4 w-4 mr-2" />
          Upgrade to Publish More
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={onPublish} disabled={disabled} className="w-full">
      {children}
    </Button>
  );
}
