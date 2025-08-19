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
      credentials,
      { withCredentials: true }
    );

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
    // Clear all query cache before logging out
    const queryClient = getQueryClient();
    queryClient.clear();

    await axios.post(
      "/users/logout",
      {},
      {
        withCredentials: true, // Ensure credentials are sent
      }
    );
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
  ): Promise<{ message: string; user: User }> => {
    const response = await axios.post("/users/verify-email", { userId, otp });
    return response.data;
  },

  resendVerificationOTP: async (
    userId: string
  ): Promise<{ message: string }> => {
    const response = await axios.post("/users/resend-verification", { userId });

    return response.data;
  },
};
