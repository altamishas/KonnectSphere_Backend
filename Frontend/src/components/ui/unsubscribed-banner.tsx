"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Eye, EyeOff } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import { authService } from "@/services/auth-service";
import {
  resubscribeStart,
  resubscribeSuccess,
  resubscribeFail,
} from "@/store/slices/auth-slice";
import { toast } from "sonner";

export function UnsubscribedBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const { mutate: resubscribe, isPending: isResubscribing } = useMutation({
    mutationFn: () => {
      dispatch(resubscribeStart());
      return authService.resubscribeAccount();
    },
    onSuccess: (response) => {
      if (response?.message === "User resubscribed successfully") {
        dispatch(resubscribeSuccess());
        toast.success("Welcome back! Your data is now visible again.");
        setIsVisible(false);
      } else {
        dispatch(resubscribeFail("Unexpected response"));
        toast.error("Unexpected response from server.");
      }
    },
    onError: (
      error: Error & { response?: { data?: { message?: string } } }
    ) => {
      const message =
        error?.response?.data?.message ||
        "Failed to resubscribe. Please try again.";
      dispatch(resubscribeFail(message));
      toast.error(message);
    },
  });

  const handleResubscribe = () => {
    resubscribe();
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  // Don't show if user is not unsubscribed or banner is dismissed
  if (!user?.isUnsubscribed || !isVisible) {
    return null;
  }

  return (
    <Alert className="relative mb-4 rounded-md border-warning bg-warning/10 p-4 text-warning-foreground">
      <EyeOff className="h-4 w-4 text-warning" />
      <AlertDescription className="pr-8">
        <div className="flex w-full items-center justify-between ">
          <div>
            <p className="font-medium">
              Your account is currently hidden from other users.
            </p>
            <p className="text-sm">
              Your pitches and profile won&apos;t appear in searches or featured
              listings.
            </p>
          </div>
          <div className="ml-4 flex items-center gap-2">
            <Button
              onClick={handleResubscribe}
              disabled={isResubscribing}
              size="sm"
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              <Eye className="mr-1 h-4 w-4" />
              {isResubscribing ? "Resubscribing..." : "Show My Data"}
            </Button>
          </div>
        </div>
      </AlertDescription>
      <Button
        onClick={handleDismiss}
        variant="ghost"
        size="sm"
        className="absolute right-2 top-2 h-6 w-6 p-0 text-warning hover:text-warning/90"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </Button>
    </Alert>
  );
}
