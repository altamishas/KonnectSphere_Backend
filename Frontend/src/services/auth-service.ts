// File: services/auth-service.ts

import axios from "@/lib/axios";
import {
  AuthError,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "@/lib/types";
import { getQueryClient } from "@/utils/queryClient"; // We'll create this utility

export const authService = {
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    console.log("Request Reached successfully:");
    const response = await axios.post<AuthResponse>(
      "/users/register",
      userData
    );
    console.log("User registered successfully:", response.data);
    return response.data;
  },

  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>(
      "/users/login",
      credentials
    );

    // Store token in localStorage as fallback for cross-domain issues
    const token = response.data.accessToken || response.data.token;
    if (token && typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("auth_status", "authenticated");

      // Set a readable cookie as fallback for middleware
      document.cookie = `auth_status=authenticated; path=/; max-age=${
        3 * 24 * 60 * 60
      }; ${
        window.location.protocol === "https:"
          ? "secure; samesite=none"
          : "samesite=lax"
      }`;
    }

    // Ensure any previous user data is cleared
    const queryClient = getQueryClient();
    queryClient.clear(); // This will clear all queries in the cache

    return response.data;
  },

  getCurrentUser: async () => {
    const response = await axios.get("/users/me", {
      params: { t: Date.now() }, // Cache-busting parameter
    });
    return response.data;
  },

  logout: async () => {
    try {
      // Call backend logout to clear HTTP-only cookies
      await axios.post(
        "/users/logout",
        {},
        {
          withCredentials: true, // Ensure credentials are sent
        }
      );
    } catch (error) {
      console.error("Logout error:", error);
      // Continue with local cleanup even if backend call fails
    } finally {
      // Always clear local auth data
      authService.clearAuthData();

      // Clear all query cache after logging out
      const queryClient = getQueryClient();
      queryClient.clear();
    }
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ message: string }> => {
    const response = await axios.patch(
      "/users/updateProfile/changePassword",
      data
    );
    return response.data;
  },

  deleteAccount: async (data: {
    password: string;
  }): Promise<{ message: string }> => {
    try {
      const response = await axios.delete("/users/deleteUser", {
        data,
        withCredentials: true, // Ensure credentials are sent for proper cookie clearing
      });

      // Clear all query cache when deleting account
      const queryClient = getQueryClient();
      queryClient.clear();

      // Clear any stored tokens from localStorage/sessionStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("authToken");

        // Clear any other auth-related data
        localStorage.removeItem("auth");
        sessionStorage.removeItem("auth");
      }

      return response.data;
    } catch (err) {
      const error = err as AuthError;
      throw error;
    }
  },

  unsubscribeAccount: async (): Promise<{ message: string }> => {
    try {
      const response = await axios.patch("/users/unsubscribe");

      // Clear all query cache when unsubscribing
      const queryClient = getQueryClient();
      queryClient.clear();

      return response.data;
    } catch (err) {
      const error = err as AuthError;
      throw error;
    }
  },

  resubscribeAccount: async (): Promise<{ message: string }> => {
    try {
      const response = await axios.patch("/users/resubscribe");

      // Refresh query cache when resubscribing
      const queryClient = getQueryClient();
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });

      return response.data;
    } catch (err) {
      const error = err as AuthError;
      throw error;
    }
  },

  updateProfile: async (
    profileData: FormData
  ): Promise<{ message: string; user: User }> => {
    const response = await axios.put("/users/updateProfile", profileData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await axios.post("/users/forgot-password", { email });
    return response.data;
  },

  verifyResetToken: async (
    token: string
  ): Promise<{ message: string; userId: string }> => {
    const response = await axios.get(`/users/reset-password/${token}`);
    return response.data;
  },

  resetPassword: async (
    token: string,
    password: string
  ): Promise<{ message: string }> => {
    const response = await axios.post(`/users/reset-password/${token}`, {
      password,
    });
    return response.data;
  },

  verifyEmail: async (
    userId: string,
    otp: string
  ): Promise<{ message: string; user: User; token?: string }> => {
    const response = await axios.post("/users/verify-email", { userId, otp });

    // Store token after successful verification
    if (response.data.token && typeof window !== "undefined") {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("auth_status", "authenticated");

      document.cookie = `auth_status=authenticated; path=/; max-age=${
        3 * 24 * 60 * 60
      }; ${
        window.location.protocol === "https:"
          ? "secure; samesite=none"
          : "samesite=lax"
      }`;
    }

    return response.data;
  },

  resendVerificationOTP: async (
    userId: string
  ): Promise<{ message: string }> => {
    const response = await axios.post("/users/resend-verification", { userId });

    return response.data;
  },

  // Enhanced authentication helper methods
  isAuthenticated: (): boolean => {
    if (typeof window === "undefined") {
      return false;
    }

    // Check localStorage token
    const localToken = localStorage.getItem("token");
    const localAuthStatus = localStorage.getItem("auth_status");

    // Check readable cookie
    const cookieAuthStatus = authService.getCookie("auth_status");

    // User is authenticated if any method indicates authentication
    return !!(
      localToken ||
      localAuthStatus === "authenticated" ||
      cookieAuthStatus === "authenticated"
    );
  },

  getToken: (): string | null => {
    if (typeof window === "undefined") {
      return null;
    }

    // Try localStorage first (most reliable for cross-domain)
    const localToken = localStorage.getItem("token");
    if (localToken) {
      return localToken;
    }

    // If no localStorage token, we rely on HTTP-only cookies
    // which are automatically sent with requests
    return null;
  },

  clearAuthData: (): void => {
    if (typeof window === "undefined") {
      return;
    }

    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("auth_status");

    // Clear readable cookies
    document.cookie =
      "auth_status=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    // Clear legacy auth data
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("authToken");
    localStorage.removeItem("auth");
    sessionStorage.removeItem("auth");

    // Note: HTTP-only cookies will be cleared by the backend
  },

  getCookie: (name: string): string | null => {
    if (typeof window === "undefined") {
      return null;
    }

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift() || null;
    }
    return null;
  },

  refreshAuthStatus: async (): Promise<boolean> => {
    try {
      await authService.getCurrentUser();
      return true;
    } catch (error) {
      console.error("Auth refresh error:", error);
      authService.clearAuthData();
      return false;
    }
  },

  initializeAuth: (): void => {
    if (typeof window === "undefined") {
      return;
    }

    // Check if we have tokens but no auth status
    const token = localStorage.getItem("token");
    const authStatus = localStorage.getItem("auth_status");

    if (token && !authStatus) {
      localStorage.setItem("auth_status", "authenticated");

      document.cookie = `auth_status=authenticated; path=/; max-age=${
        3 * 24 * 60 * 60
      }; ${
        window.location.protocol === "https:"
          ? "secure; samesite=none"
          : "samesite=lax"
      }`;
    }
  },
};
