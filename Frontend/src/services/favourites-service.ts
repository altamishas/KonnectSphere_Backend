import axios from "axios";

// Configure axios instance for favourites API
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
});

export interface FavouritePitch {
  _id: string;
  companyInfo: {
    pitchTitle: string;
    website?: string;
    country: string;
    phoneNumber?: string;
    industry1: string;
    industry2?: string;
    stage: string;
    idealInvestorRole?: string;
    previousRaised?: string;
    raisingAmount: string;
    raisedSoFar?: string;
    minimumInvestment: string;
  };
  pitchDeal?: {
    summary: string;
    business: string;
    market: string;
    progress: string;
    objectives: string;
    dealType: "equity" | "loan";
  };
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    company?: string;
    location?: string;
  };
  media?: {
    logo?: {
      public_id: string;
      url: string;
    };
    banner?: {
      public_id: string;
      url: string;
    };
    images?: {
      public_id: string;
      url: string;
    }[];
  };
  isPremium?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FavouritesResponse {
  success: boolean;
  data: FavouritePitch[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FavouriteStatusResponse {
  success: boolean;
  data: {
    isFavourite: boolean;
  };
}

export interface FavouritesCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

const favouritesService = {
  // Add pitch to favourites
  addToFavourites: async (pitchId: string): Promise<void> => {
    const response = await api.post("/favourites", { pitchId });
    return response.data;
  },

  // Remove pitch from favourites
  removeFromFavourites: async (pitchId: string): Promise<void> => {
    const response = await api.delete(`/favourites/${pitchId}`);
    return response.data;
  },

  // Get all favourite pitches
  getFavourites: async (page = 1, limit = 12): Promise<FavouritesResponse> => {
    const response = await api.get(`/favourites?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Check if a pitch is in favourites
  checkFavouriteStatus: async (
    pitchId: string
  ): Promise<FavouriteStatusResponse> => {
    const response = await api.get(`/favourites/check/${pitchId}`);
    return response.data;
  },

  // Get favourites count
  getFavouritesCount: async (): Promise<FavouritesCountResponse> => {
    const response = await api.get("/favourites/count");
    return response.data;
  },

  // Toggle favourite status (convenience method)
  toggleFavourite: async (pitchId: string): Promise<{ added: boolean }> => {
    try {
      // First check current status
      const statusResponse = await favouritesService.checkFavouriteStatus(
        pitchId
      );

      if (statusResponse.data.isFavourite) {
        // Remove from favourites
        await favouritesService.removeFromFavourites(pitchId);
        return { added: false };
      } else {
        // Add to favourites
        await favouritesService.addToFavourites(pitchId);
        return { added: true };
      }
    } catch (error) {
      throw error;
    }
  },
};

export default favouritesService;
