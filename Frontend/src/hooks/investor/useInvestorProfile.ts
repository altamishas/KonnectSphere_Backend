"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { investorService } from "@/services/investor-service";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";

export interface InvestorProfileData {
  // Profile info fields
  aboutMe: string;
  areasOfExpertise: string;
  previousInvestments?: number;

  // Investment preferences fields
  investmentRangeMin: number;
  investmentRangeMax: number;
  maxInvestmentsPerYear: number;
  interestedIndustries?: string[];
  pitchCountries?: string[];
  countryName: string;
  investmentStages: string[];
}

export const useInvestorProfile = () => {
  const { handleError, handleSuccess } = useErrorHandler();
  const queryClient = useQueryClient();
  const router = useRouter();

  const updateProfileMutation = useMutation({
    mutationFn: (profileData: InvestorProfileData) =>
      investorService.updateInvestorProfile(profileData),
    onSuccess: () => {
      handleSuccess("Investor profile completed successfully!");

      // Invalidate user data to refresh the profile completion status
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });

      // Redirect to dashboard or home page
      router.push("/");
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      handleError(error, "Failed to update investor profile");
    },
  });

  const completeInvestorProfile = (profileData: InvestorProfileData) => {
    updateProfileMutation.mutate(profileData);
  };

  return {
    completeInvestorProfile,
    isLoading: updateProfileMutation.isPending,
    isError: updateProfileMutation.isError,
    error: updateProfileMutation.error,
  };
};
