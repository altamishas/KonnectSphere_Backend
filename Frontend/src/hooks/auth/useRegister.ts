import { useMutation } from "@tanstack/react-query";
import { useAppDispatch } from "@/hooks/hooks";
import {
  authStart,
  authFail,
  setVerificationPending,
} from "@/store/slices/auth-slice";
import { authService } from "@/services/auth-service";
import { RegisterRequest } from "@/lib/types";
import { useErrorHandler } from "@/hooks/useErrorHandler";

export function useRegister() {
  const dispatch = useAppDispatch();
  const { handleError, handleSuccess } = useErrorHandler();

  return useMutation({
    mutationFn: (userData: RegisterRequest) => {
      dispatch(authStart());
      return authService.register(userData);
    },
    onSuccess: (data) => {
      if (data.userId) {
        dispatch(setVerificationPending(data.userId));
        handleSuccess("Registration successful! Please verify your email.");
      } else {
        dispatch(authFail("Registration response missing userId"));
        handleError("Registration failed: Invalid server response");
      }
    },
    onError: (error: unknown) => {
      const errorMessage = handleError(
        error,
        "Registration failed. Please try again."
      );
      dispatch(authFail(errorMessage));
    },
  });
}
