// hooks/useLogin.ts
import { useMutation } from "@tanstack/react-query";
import { useAppDispatch } from "@/hooks/hooks";
import { authService } from "@/services/auth-service";
import { LoginRequest } from "@/lib/types";
import { authStart, authSuccess, authFail } from "@/store/slices/auth-slice";
import { useErrorHandler } from "@/hooks/useErrorHandler";

export function useLogin() {
  const dispatch = useAppDispatch();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => {
      dispatch(authStart());
      return authService.login(credentials);
    },
    onSuccess: (data) => {
      dispatch(authSuccess({ user: data.user }));
    },
    onError: (error: unknown) => {
      const errorMessage = handleError(
        error,
        "Failed to log in. Please check your credentials and try again."
      );
      dispatch(authFail(errorMessage));
    },
  });
}
