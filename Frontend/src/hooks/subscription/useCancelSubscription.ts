import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscription-service";
import { toast } from "sonner";
import { SUBSCRIPTION_KEYS } from "./useSubscription";

interface CancelSubscriptionData {
  reason?: string;
  feedback?: string;
  immediate?: boolean;
}

export const useCancelSubscriptionWithDialog = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cancelData, setCancelData] = useState<CancelSubscriptionData>({
    reason: "",
    feedback: "other",
    immediate: false,
  });

  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: subscriptionService.cancelSubscription,
    onSuccess: (data) => {
      // Invalidate subscription queries to trigger immediate refresh
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEYS.current() });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEYS.all });

      // Force refetch the current subscription
      queryClient.refetchQueries({ queryKey: SUBSCRIPTION_KEYS.current() });

      toast.success(data.message);
      setIsDialogOpen(false);
      setCancelData({
        reason: "",
        feedback: "other",
        immediate: false,
      });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to cancel subscription";
      toast.error(message);
    },
  });

  const handleCancelClick = () => {
    setIsDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    cancelMutation.mutate(cancelData);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setCancelData({
      reason: "",
      feedback: "other",
      immediate: false,
    });
  };

  const updateCancelData = (data: Partial<CancelSubscriptionData>) => {
    setCancelData((prev) => ({ ...prev, ...data }));
  };

  return {
    isDialogOpen,
    cancelData,
    isPending: cancelMutation.isPending,
    handleCancelClick,
    handleConfirmCancel,
    handleDialogClose,
    updateCancelData,
  };
};
