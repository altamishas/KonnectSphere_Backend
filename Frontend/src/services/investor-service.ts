import axiosInstance from "@/lib/axios";
import { Investor, InvestorSearchResponse, User } from "@/lib/types";

export interface InvestorSearchParams {
  query?: string;
  investmentRange?: [number, number];
  countries?: string[];
  industries?: string[];
  stages?: string[];
  sortBy?: "relevance" | "investments" | "connections";
  page?: number;
  limit?: number;
}

class InvestorService {
  async searchInvestors(
    params: InvestorSearchParams
  ): Promise<InvestorSearchResponse> {
    try {
      const response = await axiosInstance.get("/investors/search", {
        params: {
          ...params,
          industries: params.industries?.join(","),
          countries: params.countries?.join(","),
          stages: params.stages?.join(","),
          investmentRangeMin: params.investmentRange?.[0],
          investmentRangeMax: params.investmentRange?.[1],
        },
      });

      const result = {
        investors: response.data.data.investors,
        total: response.data.data.pagination.totalItems,
        page: response.data.data.pagination.current,
        totalPages: response.data.data.pagination.total,
        limit: params.limit || 20,
      };

      return result;
    } catch (error) {
      console.error("Error searching investors:", error);
      throw error;
    }
  }

  async getInvestorById(id: string): Promise<Investor> {
    try {
      const response = await axiosInstance.get(`/investors/${id}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching investor:", error);
      throw error;
    }
  }

  async getInvestorProfile(id: string): Promise<User> {
    try {
      const response = await axiosInstance.get(`/users/profile/${id}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching investor profile:", error);
      throw error;
    }
  }

  async getFeaturedInvestors(): Promise<User[]> {
    try {
      const response = await axiosInstance.get("/users/featured-investors");
      console.log("🚀 Featured investors:", response.data.data);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching featured investors:", error);
      // Return empty array instead of throwing error to avoid breaking the homepage
      return [];
    }
  }

  async starInvestor(investorId: string): Promise<void> {
    try {
      await axiosInstance.post(`/investors/${investorId}/star`, {
        action: "star",
      });
    } catch (error) {
      console.error("Error starring investor:", error);
      throw error;
    }
  }

  async unstarInvestor(investorId: string): Promise<void> {
    try {
      await axiosInstance.post(`/investors/${investorId}/star`, {
        action: "unstar",
      });
    } catch (error) {
      console.error("Error unstarring investor:", error);
      throw error;
    }
  }

  async connectWithInvestor(
    investorId: string,
    message?: string
  ): Promise<void> {
    try {
      await axiosInstance.post(`/investors/${investorId}/connect`, {
        message,
      });
    } catch (error) {
      console.error("Error connecting with investor:", error);
      throw error;
    }
  }

  async sendMessageToInvestor(
    investorId: string,
    message: string
  ): Promise<void> {
    try {
      await axiosInstance.post(`/investors/${investorId}/message`, {
        message,
      });
    } catch (error) {
      console.error("Error sending message to investor:", error);
      throw error;
    }
  }

  async updateInvestorProfile(profileData: {
    // Basic fields
    countryName?: string;

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
    investmentStages?: string[];
  }): Promise<void> {
    try {
      console.log("🚀 Sending investor profile update:", profileData);

      // Prepare consolidated data structure for the backend
      const requestPayload = new FormData();

      // Add basic fields
      if (profileData.countryName) {
        requestPayload.append("countryName", profileData.countryName);
      }

      // Add profile info data
      const profileInfo = {
        aboutMe: profileData.aboutMe,
        areasOfExpertise: profileData.areasOfExpertise
          .split(",")
          .map((s) => s.trim()),
        previousInvestments: profileData.previousInvestments || 0,
      };

      // Add investment preferences data
      const investmentPreferences = {
        investmentRangeMin: profileData.investmentRangeMin,
        investmentRangeMax: profileData.investmentRangeMax,
        maxInvestmentsPerYear: profileData.maxInvestmentsPerYear,
        interestedIndustries: profileData.interestedIndustries || [],
        investmentStages: profileData.investmentStages || [],
        interestedLocations: [], // Can be filled later
        pitchCountries: profileData.pitchCountries || [],
        languages: [], // Can be filled later
        additionalCriteria: "", // Can be filled later
      };

      requestPayload.append("profileInfo", JSON.stringify(profileInfo));
      requestPayload.append(
        "investmentPreferences",
        JSON.stringify(investmentPreferences)
      );
      requestPayload.append("isInvestorProfileComplete", "true");

      console.log("📤 Request payload:", {
        profileInfo,
        investmentPreferences,
        isInvestorProfileComplete: true,
      });

      const response = await axiosInstance.put(
        "/users/updateProfile",
        requestPayload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("✅ Profile update successful:", response.data);

      return response.data;
    } catch (error: unknown) {
      console.error("❌ Error updating investor profile:", error);

      // Type-safe error handling for axios errors
      const axiosError = error as {
        response?: {
          data?: unknown;
          status?: number;
          headers?: unknown;
        };
      };

      if (axiosError.response) {
        console.error("Response data:", axiosError.response.data);
        console.error("Response status:", axiosError.response.status);
        console.error("Response headers:", axiosError.response.headers);
      }
      throw error;
    }
  }
}

const investorService = new InvestorService();
export { investorService };
export default investorService;
