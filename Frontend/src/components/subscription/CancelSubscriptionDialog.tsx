"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CancelSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  cancelData: {
    reason?: string;
    feedback?: string;
    immediate?: boolean;
  };
  updateCancelData: (
    data: Partial<{
      reason?: string;
      feedback?: string;
      immediate?: boolean;
    }>
  ) => void;
  planName?: string;
}

const feedbackOptions = [
  { value: "too_expensive", label: "Too expensive" },
  { value: "missing_features", label: "Missing features" },
  { value: "switched_service", label: "Switched to another service" },
  { value: "unused", label: "Not using the service" },
  { value: "customer_service", label: "Customer service issues" },
  { value: "low_quality", label: "Low quality" },
  { value: "other", label: "Other" },
];

export default function CancelSubscriptionDialog({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  cancelData,
  updateCancelData,
  planName = "subscription",
}: CancelSubscriptionDialogProps) {
  const handleReasonChange = (value: string) => {
    updateCancelData({ reason: value });
  };

  const handleFeedbackChange = (value: string) => {
    updateCancelData({ feedback: value });
  };

  const handleImmediateChange = (checked: boolean) => {
    updateCancelData({ immediate: checked });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Cancel Subscription
              </DialogTitle>
              <Badge
                variant="secondary"
                className="mt-1 text-primary font-bold"
              >
                {planName}
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-black dark:text-white">
            We&apos;re sorry to see you go! Help us understand why you&apos;re
            canceling so we can improve our service.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Feedback Selection */}
          <div className="space-y-2 w-full">
            <Label htmlFor="feedback" className="text-sm font-bold">
              Why are you canceling? *
            </Label>
            <div className="w-full cursor-pointer">
              <Select
                value={cancelData.feedback}
                onValueChange={handleFeedbackChange}
              >
                <SelectTrigger className="cursor-pointer w-[25rem]">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent className="max-w-full">
                  {feedbackOptions.map((option) => (
                    <SelectItem
                      className="cursor-pointer hover:bg-primary hover:font-bold w-full"
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Comments */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Additional comments (optional)
            </Label>
            <Textarea
              id="reason"
              placeholder="Tell us more about your experience..."
              value={cancelData.reason}
              onChange={(e) => handleReasonChange(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Immediate Cancellation Option */}
          <div className="bg-background dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="immediate"
                checked={cancelData.immediate}
                onCheckedChange={handleImmediateChange}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label
                  htmlFor="immediate"
                  className="text-sm cursor-pointer font-bold"
                >
                  Cancel immediately
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {cancelData.immediate ? (
                    <span className="text-primary dark:text-primary">
                      Your subscription will be canceled immediately and access
                      will end now.
                    </span>
                  ) : (
                    <span>
                      Your subscription will continue until the end of your
                      current billing period.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-background dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Before you cancel
                </h4>
                <ul className="text-xs text-red-700 dark:text-red-300 mt-1 space-y-1">
                  <li>• You&apos;ll lose access to all premium features</li>
                  <li>• Your pitches may become hidden</li>
                  <li>• You can reactivate anytime by subscribing again</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="flex-1"
          >
            <X className="mr-2 h-4 w-4" />
            Keep Subscription
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending || !cancelData.feedback}
            variant="destructive"
            className="flex-1"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Canceling...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Confirm Cancellation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
