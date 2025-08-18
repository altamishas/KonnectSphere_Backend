import axios from "axios";

// Configure axios instance for preferred pitches API
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
});

export interface PreferredPitch {
  id: string;
  title: string;
  description: string;
  industry: string;
  fundingGoal: number;
  fundingRaised: number;
  stage: string;
  country: string;
  entrepreneur: {
    name: string;
    avatar: string;
    company: string;
  };
  isPremium: boolean;
  createdAt: string;
  media: Record<string, unknown>;
}

export interface PreferredPitchesResponse {
  success: boolean;
  data: PreferredPitch[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta: {
    preferences: {
      investmentRange: string;
      industries: string;
      countries: string;
    };
  };
}

const preferredPitchesService = {
  // Get preferred pitches based on investor's settings
  getPreferredPitches: async (
    page = 1,
    limit = 12
  ): Promise<PreferredPitchesResponse> => {
    const response = await api.get(
      `/investors/preferred-pitches?page=${page}&limit=${limit}`
    );
    return response.data;
  },
};

export default preferredPitchesService;
