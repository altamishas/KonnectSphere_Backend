import { useMutation } from "@tanstack/react-query";
import { useAppDispatch } from "@/hooks/hooks";
import { authService } from "@/services/auth-service";
import {
  authSuccess,
  clearVerificationPending,
} from "@/store/slices/auth-slice";
import { toast } from "sonner";
import { AxiosError } from "axios";

export function useEmailVerification() {
  const dispatch = useAppDispatch();

  const verifyEmail = useMutation({
    mutationFn: async ({ userId, otp }: { userId: string; otp: string }) => {
      return authService.verifyEmail(userId, otp);
    },
    onSuccess: (data) => {
      dispatch(authSuccess({ user: data.user }));
      dispatch(clearVerificationPending());
      toast.success("Email verified successfully!");
    },
    onError: (error: unknown) => {
      const err = error as AxiosError<{ message?: string }>;
      const errorMessage =
        err.response?.data?.message || err.message || "Verification failed";
      toast.error(errorMessage);
    },
  });

  const resendOTP = useMutation({
    mutationFn: async (userId: string) => {
      return authService.resendVerificationOTP(userId);
    },
    onSuccess: () => {
      toast.success("Verification code resent successfully!");
    },
    onError: (error: unknown) => {
      const err = error as AxiosError<{ message?: string }>;
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to resend verification code";
      toast.error(errorMessage);
    },
  });

  return {
    verifyEmail,
    resendOTP,
  };
}
