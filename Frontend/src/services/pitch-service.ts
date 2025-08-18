import {
  CompanyInfoFormData,
  PitchDealFormData,
  TeamFormData,
  MediaFormData,
  DocumentsFormData,
  PackagesFormData,
} from "@/lib/types";
import { ViewPitchData } from "@/lib/types/pitch-view";
import { getQueryClient } from "@/utils/queryClient";
import api from "@/lib/axios";
import { PitchFilterState } from "@/components/explore/PitchFilters";

// Define proper interface for pitch data
export interface PitchData {
  _id: string;
  companyInfo: {
    pitchTitle: string;
    industry1: string;
    raisingAmount: string;
    raisedSoFar: string;
    country: string;
    stage: string;
  };
  pitchDeal: {
    summary: string;
  };
  media: {
    banner?: { url: string };
    logo?: { url: string };
  };
  user: {
    subscriptionPlan: "Free" | "Basic" | "Premium" | "Investor Access Plan";
  };
  publishedAt: string;
  createdAt: string;
  status: "published" | "draft";
}

// Enhanced interface for pitch query parameters
export interface PitchQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  // User context
  userSubscriptionPlan?: "Free" | "Basic" | "Premium" | "Investor Access Plan";
  userCountry?: string;
  userRole?: "Investor" | "Entrepreneur" | "investor" | "entrepreneur";
  // Advanced filters
  investmentRange?: [number, number];
  countries?: string[];
  industries?: string[];
  stages?: string[];
  fundingTypes?: string[];
  // Sorting and priority
  sortBy?: "newest" | "priority" | "funding-amount";
  prioritizePremium?: boolean;
}

// Response interface for paginated pitches
export interface PitchesResponse {
  success: boolean;
  data: {
    pitches: PitchData[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    meta: {
      premiumCount: number;
      basicCount: number;
      filteredCount: number;
    };
  };
}

// Response interfaces following your pattern
interface PitchResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

interface PitchDraftData {
  _id: string;
  userId: string;
  companyInfo: Partial<CompanyInfoFormData>;
  pitchDeal: Partial<PitchDealFormData>;
  team: Partial<TeamFormData>;
  media: Partial<MediaFormData>;
  documents: Partial<DocumentsFormData>;
  package: Partial<PackagesFormData>;
  completedSteps: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface StepUpdateData {
  companyInfo?: Partial<CompanyInfoFormData>;
  pitchDeal?: Partial<PitchDealFormData>;
  team?: Partial<TeamFormData>;
  media?: Partial<MediaFormData>;
  documents?: Partial<DocumentsFormData>;
  package?: Partial<PackagesFormData>;
  completedSteps: string[];
}

interface FileUploadData {
  public_id: string;
  url: string;
  originalName: string;
}

// Type for auto-save data
type AutoSaveData =
  | Partial<CompanyInfoFormData>
  | Partial<PitchDealFormData>
  | Partial<TeamFormData>
  | Partial<MediaFormData>
  | Partial<DocumentsFormData>
  | Partial<PackagesFormData>;

export const pitchService = {
  // Get or create pitch draft
  getPitchDraft: async (): Promise<{
    success: boolean;
    message: string;
    data: PitchDraftData;
  }> => {
    const response = await api.get<{
      success: boolean;
      message: string;
      data: PitchDraftData;
    }>("/pitches/draft", {
      params: { t: Date.now() }, // Cache-busting parameter
    });
    return response.data;
  },

  // Update company info step
  updateCompanyInfo: async (
    data: CompanyInfoFormData
  ): Promise<{ success: boolean; message: string; data: StepUpdateData }> => {
    const response = await api.put<{
      success: boolean;
      message: string;
      data: StepUpdateData;
    }>("/pitches/company-info", data);
    return response.data;
  },

  // Update pitch deal step
  updatePitchDeal: async (
    data: PitchDealFormData
  ): Promise<{ success: boolean; message: string; data: StepUpdateData }> => {
    const response = await api.put<{
      success: boolean;
      message: string;
      data: StepUpdateData;
    }>("/pitches/pitch-deal", data);
    return response.data;
  },

  // Update team step with file uploads
  updateTeam: async (
    data: TeamFormData
  ): Promise<{ success: boolean; message: string; data: StepUpdateData }> => {
    const formData = new FormData();

    // Add members data as JSON string
    formData.append("members", JSON.stringify(data.members || []));

    // Add profile image files
    data.members?.forEach((member, index) => {
      if (member.profileImageFile && member.profileImageFile instanceof File) {
        formData.append(`profileImage_${index}`, member.profileImageFile);
      }
    });

    const response = await api.put<{
      success: boolean;
      message: string;
      data: StepUpdateData;
    }>("/pitches/team", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Update media step with file uploads
  updateMedia: async (
    data: MediaFormData
  ): Promise<{ success: boolean; message: string; data: StepUpdateData }> => {
    const formData = new FormData();

    // Add basic media data
    formData.append("videoType", data.videoType || "youtube");
    if (data.youtubeUrl) {
      formData.append("youtubeUrl", data.youtubeUrl);
    }

    // Add current file data for cleanup
    if (data.logo && !data.logoFile) {
      formData.append("currentLogo", JSON.stringify(data.logo));
    }
    if (data.banner && !data.bannerFile) {
      formData.append("currentBanner", JSON.stringify(data.banner));
    }
    if (data.uploadedVideo && !data.uploadedVideoFile) {
      formData.append(
        "currentUploadedVideo",
        JSON.stringify(data.uploadedVideo)
      );
    }

    // Add file uploads
    if (data.logoFile && data.logoFile instanceof File) {
      formData.append("logo", data.logoFile);
    }
    if (data.bannerFile && data.bannerFile instanceof File) {
      formData.append("banner", data.bannerFile);
    }
    if (data.imageFiles && data.imageFiles.length > 0) {
      data.imageFiles.forEach((file) => {
        if (file instanceof File) {
          formData.append("images", file);
        }
      });
    }
    if (data.uploadedVideoFile && data.uploadedVideoFile instanceof File) {
      formData.append("uploadedVideo", data.uploadedVideoFile);
    }

    const response = await api.put<{
      success: boolean;
      message: string;
      data: StepUpdateData;
    }>("/pitches/media", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Update documents step with file uploads
  updateDocuments: async (
    data: DocumentsFormData
  ): Promise<{ success: boolean; message: string; data: StepUpdateData }> => {
    const formData = new FormData();

    // Add current file data for cleanup
    if (data.businessPlan && !data.businessPlanFile) {
      formData.append("currentBusinessPlan", JSON.stringify(data.businessPlan));
    }
    if (data.financials && !data.financialsFile) {
      formData.append("currentFinancials", JSON.stringify(data.financials));
    }
    if (data.pitchDeck && !data.pitchDeckFile) {
      formData.append("currentPitchDeck", JSON.stringify(data.pitchDeck));
    }
    if (data.executiveSummary && !data.executiveSummaryFile) {
      formData.append(
        "currentExecutiveSummary",
        JSON.stringify(data.executiveSummary)
      );
    }

    // Add file uploads
    if (data.businessPlanFile && data.businessPlanFile instanceof File) {
      formData.append("businessPlan", data.businessPlanFile);
    }
    if (data.financialsFile && data.financialsFile instanceof File) {
      formData.append("financials", data.financialsFile);
    }
    if (data.pitchDeckFile && data.pitchDeckFile instanceof File) {
      formData.append("pitchDeck", data.pitchDeckFile);
    }
    if (
      data.executiveSummaryFile &&
      data.executiveSummaryFile instanceof File
    ) {
      formData.append("executiveSummary", data.executiveSummaryFile);
    }
    if (
      data.additionalDocumentFiles &&
      data.additionalDocumentFiles.length > 0
    ) {
      data.additionalDocumentFiles.forEach((file) => {
        if (file instanceof File) {
          formData.append("additionalDocuments", file);
        }
      });
    }

    const response = await api.put<{
      success: boolean;
      message: string;
      data: StepUpdateData;
    }>("/pitches/documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Update package step and submit pitch
  updatePackage: async (
    data: PackagesFormData
  ): Promise<{ success: boolean; message: string; data: StepUpdateData }> => {
    const response = await api.put<{
      success: boolean;
      message: string;
      data: StepUpdateData;
    }>("/pitches/package", data);
    return response.data;
  },

  // Auto-save pitch data
  autoSavePitch: async (
    stepName: string,
    stepData: AutoSaveData
  ): Promise<PitchResponse> => {
    const response = await api.post<PitchResponse>("/pitches/auto-save", {
      stepName,
      stepData,
    });
    return response.data;
  },

  // Upload file
  uploadFile: async (
    file: File,
    fileType: "image" | "video" | "document"
  ): Promise<{ success: boolean; message: string; data: FileUploadData }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<{
      success: boolean;
      message: string;
      data: FileUploadData;
    }>(`/pitches/upload/${fileType}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Delete file
  deleteFile: async (
    publicId: string,
    resourceType: string
  ): Promise<PitchResponse> => {
    const response = await api.delete<PitchResponse>("/pitches/file", {
      data: { publicId, resourceType },
    });
    return response.data;
  },

  // Get user's pitches
  getUserPitches: async (): Promise<{
    success: boolean;
    message: string;
    data: PitchDraftData[];
  }> => {
    const response = await api.get<{
      success: boolean;
      message: string;
      data: PitchDraftData[];
    }>("/pitches/my-pitches", {
      params: { t: Date.now() }, // Cache-busting parameter
    });
    return response.data;
  },

  // Enhanced method to get published pitches with advanced filtering and sorting
  async getPublishedPitches(
    params: PitchQueryParams
  ): Promise<PitchesResponse> {
    try {
      const queryParams = new URLSearchParams();

      // Basic pagination
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.search) queryParams.append("search", params.search);

      // User context for access control
      if (params.userSubscriptionPlan) {
        queryParams.append("userSubscriptionPlan", params.userSubscriptionPlan);
      }
      if (params.userCountry) {
        queryParams.append("userCountry", params.userCountry);
      }
      if (params.userRole) {
        queryParams.append("userRole", params.userRole);
      }

      // Advanced filters
      if (params.investmentRange) {
        queryParams.append(
          "minInvestment",
          params.investmentRange[0].toString()
        );
        queryParams.append(
          "maxInvestment",
          params.investmentRange[1].toString()
        );
      }
      if (params.countries && params.countries.length > 0) {
        queryParams.append("countries", params.countries.join(","));
      }
      if (params.industries && params.industries.length > 0) {
        queryParams.append("industries", params.industries.join(","));
      }
      if (params.stages && params.stages.length > 0) {
        queryParams.append("stages", params.stages.join(","));
      }

      if (params.fundingTypes && params.fundingTypes.length > 0) {
        queryParams.append("fundingTypes", params.fundingTypes.join(","));
      }

      // Sorting
      if (params.sortBy) {
        queryParams.append("sortBy", params.sortBy);
      }
      if (params.prioritizePremium !== undefined) {
        queryParams.append(
          "prioritizePremium",
          params.prioritizePremium.toString()
        );
      }

      const response = await api.get<PitchesResponse>(
        `/pitches/published?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching pitches:", error);
      throw error;
    }
  },

  // Check publishing rights for entrepreneurs
  async checkPublishingRights(): Promise<{
    success: boolean;
    data: {
      canPublish: boolean;
      reason?: string;
      message: string;
    };
  }> {
    const response = await api.get<{
      success: boolean;
      data: {
        canPublish: boolean;
        reason?: string;
        message: string;
      };
    }>("/pitches/publishing-rights");
    return response.data;
  },

  // Method to get user's subscription status and location
  async getUserContext(): Promise<{
    subscriptionPlan: "Free" | "Basic" | "Premium" | "Investor Access Plan";
    country: string;
    region: string;
    role: string;
  }> {
    try {
      const response = await api.get("/users/context");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching user context:", error);
      // Return default context for unauthenticated users
      return {
        subscriptionPlan: "Free",
        country: "United States",
        region: "United States",
        role: "Entrepreneur",
      };
    }
  },

  // Method to invalidate pitch cache when new pitch is published
  async invalidatePitchCache(): Promise<void> {
    try {
      await api.post("/pitch/invalidate-cache");
    } catch (error) {
      console.error("Error invalidating pitch cache:", error);
    }
  },

  // Method to get real-time pitch count for cache invalidation
  async getPitchCount(): Promise<number> {
    try {
      const response = await api.get("/pitches/count");
      return response.data.data.count;
    } catch (error) {
      console.error("Error fetching pitch count:", error);
      return 0;
    }
  },

  // Legacy method (keeping for backward compatibility)
  async getPublishedPitchesLegacy(params: Record<string, unknown>) {
    return this.getPublishedPitches(params as PitchQueryParams);
  },

  // Get single pitch by ID
  getPitchById: async (
    id: string
  ): Promise<{
    success: boolean;
    message: string;
    data: ViewPitchData;
    restricted?: boolean;
    accessLevel?: "full" | "overview-only";
  }> => {
    const response = await api.get<{
      success: boolean;
      message: string;
      data: ViewPitchData;
      restricted?: boolean;
      accessLevel?: "full" | "overview-only";
    }>(`/pitches/public/${id}`);
    return response.data;
  },

  // Get user's own pitch by ID (authenticated, any status)
  getMyPitchById: async (
    id: string
  ): Promise<{ success: boolean; message: string; data: ViewPitchData }> => {
    const response = await api.get<{
      success: boolean;
      message: string;
      data: ViewPitchData;
    }>(`/pitches/my-pitch/${id}`);
    return response.data;
  },

  // Clear pitch cache when needed
  clearPitchCache: () => {
    const queryClient = getQueryClient();
    queryClient.removeQueries({ queryKey: ["pitch"] });
  },

  // Get featured pitches for home page (public access)
  getFeaturedPitches: async (
    type: string = "trending"
  ): Promise<{
    success: boolean;
    data: PitchDraftData[];
  }> => {
    const response = await api.get<{
      success: boolean;
      data: PitchDraftData[];
    }>("/pitches/public/featured", {
      params: { type },
    });
    return response.data;
  },

  // Remove media file
  removeMediaFile: async (fileType: string, publicId: string) => {
    const response = await api.delete("/pitches/media-file", {
      data: { fileType, publicId },
    });
    return response.data;
  },

  // Cleanup empty drafts
  cleanupEmptyDrafts: async (): Promise<{
    success: boolean;
    message: string;
    data: { deletedCount: number };
  }> => {
    const response = await api.delete<{
      success: boolean;
      message: string;
      data: { deletedCount: number };
    }>("/pitches/cleanup-drafts");
    return response.data;
  },
};

// Helper function to build optimized query parameters
export const buildPitchQuery = (
  filters: PitchFilterState,
  userContext: {
    subscriptionPlan: "Free" | "Basic" | "Premium" | "Investor Access Plan";
    country: string;
    role?: string;
  },
  pagination: { page: number; limit: number },
  searchQuery?: string
): PitchQueryParams => {
  return {
    // Pagination
    page: pagination.page,
    limit: pagination.limit,

    // Search
    search: searchQuery,

    // User context
    userSubscriptionPlan: userContext.subscriptionPlan,
    userCountry: userContext.country,
    userRole: userContext.role as
      | "Investor"
      | "Entrepreneur"
      | "investor"
      | "entrepreneur"
      | undefined,

    // Filters
    investmentRange: filters.investmentRange,
    countries: filters.countries,
    industries: filters.industries,
    stages: filters.stages,
    fundingTypes: filters.fundingTypes,

    // Sorting - prioritize premium pitches and then by newest
    prioritizePremium: true,
    sortBy: "newest",
  };
};
