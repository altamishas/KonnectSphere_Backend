// File: hooks/updateProfile/useProfileUpdate.ts

import { useState, useEffect } from "react";
import { authService } from "@/services/auth-service";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import { setUser } from "@/store/slices/auth-slice";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { User } from "@/lib/types"; // Update to your actual user type

export const useProfile = () => {
  const [localError, setLocalError] = useState<string | null>(null);
  const { handleError, handleSuccess } = useErrorHandler();

  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const userProfileQueryKey = user?._id
    ? ["userProfile", user._id]
    : ["userProfile"];

  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery<User | undefined, AxiosError>({
    queryKey: userProfileQueryKey,
    queryFn: async () => {
      const response = await authService.getCurrentUser();
      if (response) {
        dispatch(setUser(response));
      }
      return response;
    },
    enabled: !!user && isAuthenticated,
    staleTime: 1000 * 60, // 1 minute to reduce frequent refetches
    gcTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (formData: FormData) => {
      console.log("🔄 Starting profile update API call");
      return authService.updateProfile(formData);
    },
    onSuccess: (data) => {
      console.log("✅ Profile update successful:", data);
      console.log("🔍 Avatar data in response:", {
        hasUser: !!data.user,
        avatarImage: data.user?.avatarImage,
        avatarUrl: data.user?.avatarImage?.url,
        publicId: data.user?.avatarImage?.public_id,
      });

      handleSuccess(data.message || "Profile updated successfully!");

      // Update user in Redux store
      if (data.user) {
        console.log("🔄 Updating Redux store with user data");
        dispatch(setUser(data.user));
        console.log("✅ Redux store updated");

        // Optimistically update the query cache to avoid a refetch
        queryClient.setQueryData(userProfileQueryKey, data.user);
      } else {
        // Fallback to refetch if user data is not in response for some reason
        queryClient.invalidateQueries({ queryKey: userProfileQueryKey });
      }
    },

    onError: (error: AxiosError) => {
      console.error("❌ Profile update failed:", error);
      console.error("Error response:", error.response?.data);

      const errorMessage = handleError(error, "Failed to update profile");
      setLocalError(errorMessage);
    },
  });

  const updateProfile = (formData: FormData) => {
    console.log("🔄 updateProfile called with:", {
      formDataEntries: Array.from(formData.entries()).map(([key, value]) => [
        key,
        value instanceof File ? `File: ${value.name}` : value,
      ]),
    });

    updateProfileMutation.mutate(formData);
  };

  useEffect(() => {
    if (user && isAuthenticated) {
      refetchProfile();
    }
  }, [user, isAuthenticated, refetchProfile]);

  useEffect(() => {
    return () => {
      setLocalError(null);
    };
  }, []);

  return {
    profile,
    isProfileLoading: isProfileLoading,
    updateProfile,
    isUpdating: updateProfileMutation.isPending,
    isSuccess: updateProfileMutation.isSuccess,
    resetMutation: updateProfileMutation.reset,
    error:
      localError ||
      profileError?.message ||
      updateProfileMutation.error?.message ||
      null,
    refetchProfile,
  };
};

// Helper function to clear user profile cache
export const clearUserProfileCache = (queryClient: QueryClient) => {
  queryClient.removeQueries({ queryKey: ["userProfile"] });
};
