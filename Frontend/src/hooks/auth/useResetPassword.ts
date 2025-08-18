// File: hooks/auth/useResetPassword.ts

import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { AxiosError } from "axios";

interface ForgotPasswordRequest {
  email: string;
}

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (data: ForgotPasswordRequest) => {
      const response = await axios.post("/users/forgot-password", data);
      return response.data;
    },
    onError: (error: unknown) => {
      const err = error as AxiosError<{ message?: string }>;
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to send reset email";
      toast.error(errorMessage);
    },
  });
};

export const useVerifyResetToken = (token: string | null) => {
  return useQuery({
    queryKey: ["resetToken", token],
    queryFn: async () => {
      if (!token) throw new Error("No token provided");
      const response = await axios.get(`/users/reset-password/${token}`);
      return response.data;
    },
    enabled: !!token, // Only run query if token exists
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: async ({
      token,
      password,
    }: {
      token: string;
      password: string;
    }) => {
      const response = await axios.post(`/users/reset-password/${token}`, {
        password,
      });
      return response.data;
    },
    onError: (error: unknown) => {
      const err = error as AxiosError<{ message?: string }>;
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to send reset email";
      toast.error(errorMessage);
      return Promise.reject(error);
    },
  });
};
