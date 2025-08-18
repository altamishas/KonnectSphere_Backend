// File: lib/auth-utils.ts

import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/hooks/hooks";
import { authService } from "@/services/auth-service";
import { logoutSuccess } from "@/store/slices/auth-slice";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Hook for handling logout with proper cache clearing
export const useLogout = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const logout = async () => {
    try {
      await authService.logout();

      // Clear all query cache
      queryClient.clear();

      // Update Redux state
      dispatch(logoutSuccess());

      // Redirect to login
      router.push("/login");

      toast.success("Logged out successfully");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to logout. Please try again.";
      toast.error(message);
    }
  };

  return { logout };
};

// Hook for handling login with proper cache handling
export const useLogin = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  const login = async (credentials: { email: string; password: string }) => {
    try {
      // Clear any existing cache before login
      queryClient.clear();

      const response = await authService.login(credentials);

      // Update Redux store with user data
      dispatch({ type: "auth/authSuccess", payload: { user: response.user } });

      // Do not redirect here; page component will honor any redirect param.

      toast.success("Logged in successfully");

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      toast.error(message);
      throw error;
    }
  };

  return { login };
};
