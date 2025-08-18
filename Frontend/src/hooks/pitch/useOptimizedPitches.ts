import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import {
  pitchService,
  PitchQueryParams,
  buildPitchQuery,
} from "@/services/pitch-service";
import { PitchFilterState } from "@/components/explore/PitchFilters";

// Query keys for cache management
export const PITCH_QUERY_KEYS = {
  all: ["pitches"] as const,
  published: (params: PitchQueryParams) =>
    ["pitches", "published", params] as const,
  userContext: ["pitches", "user-context"] as const,
  count: ["pitches", "count"] as const,
  publishingRights: ["pitches", "publishing-rights"] as const,
};

// Hook for user context (subscription and location)
export const useUserContext = () => {
  return useQuery({
    queryKey: PITCH_QUERY_KEYS.userContext,
    queryFn: pitchService.getUserContext,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    retry: 2,
  });
};

// Hook for real-time pitch count monitoring
export const usePitchCount = () => {
  return useQuery({
    queryKey: PITCH_QUERY_KEYS.count,
    queryFn: pitchService.getPitchCount,
    refetchInterval: 1000 * 60 * 2, // Check every 2 minutes
    staleTime: 1000 * 60, // 1 minute
    retry: 1,
  });
};

// Hook to check publishing rights for entrepreneurs
export const usePublishingRights = () => {
  return useQuery({
    queryKey: PITCH_QUERY_KEYS.publishingRights,
    queryFn: pitchService.checkPublishingRights,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  });
};

// Main hook for optimized pitch fetching
export const useOptimizedPitches = (
  filters: PitchFilterState,
  searchQuery: string,
  pagination: { page: number; limit: number }
) => {
  const queryClient = useQueryClient();
  const { data: userContext, isLoading: isLoadingUserContext } =
    useUserContext();
  const { data: currentPitchCount } = usePitchCount();

  // Build optimized query parameters - require authentication
  const queryParams = buildPitchQuery(
    filters,
    {
      subscriptionPlan: userContext?.subscriptionPlan || "Basic",
      country: userContext?.country || "United States",
      role: userContext?.role || "Entrepreneur", // Default to Entrepreneur if not loaded yet
    },
    pagination,
    searchQuery
  );

  // Main pitch query
  const pitchQuery = useQuery({
    queryKey: PITCH_QUERY_KEYS.published(queryParams),
    queryFn: () => pitchService.getPublishedPitches(queryParams),
    enabled: true, // Always enabled, even without user context
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Do not cache
    retry: 2,
    refetchOnWindowFocus: true, // Refetch when window regains focus
    // Keep previous data while loading new data
    placeholderData: (previousData) => previousData,
  });

  // Cache invalidation mutation for real-time updates
  const invalidatePitchCache = useMutation({
    mutationFn: pitchService.invalidatePitchCache,
    onSuccess: () => {
      // Invalidate all pitch-related queries
      queryClient.invalidateQueries({ queryKey: PITCH_QUERY_KEYS.all });
    },
  });

  // Auto-invalidate cache when pitch count changes (new pitch published)
  useEffect(() => {
    if (currentPitchCount) {
      const storedCount = localStorage.getItem("pitchCount");
      const lastKnownCount = storedCount ? parseInt(storedCount, 10) : 0;

      if (currentPitchCount > lastKnownCount) {
        // New pitch detected, invalidate cache
        queryClient.invalidateQueries({ queryKey: PITCH_QUERY_KEYS.all });
        localStorage.setItem("pitchCount", currentPitchCount.toString());
      }
    }
  }, [currentPitchCount, queryClient]);

  // Prefetch next page for better UX
  const prefetchNextPage = useCallback(() => {
    if (pitchQuery.data?.data?.pagination?.hasNext) {
      const nextPageParams = {
        ...queryParams,
        page: (queryParams.page || 1) + 1,
      };

      queryClient.prefetchQuery({
        queryKey: PITCH_QUERY_KEYS.published(nextPageParams),
        queryFn: () => pitchService.getPublishedPitches(nextPageParams),
        staleTime: 1000 * 60 * 5,
      });
    }
  }, [queryParams, pitchQuery.data, queryClient]);

  // Prefetch previous page
  const prefetchPreviousPage = useCallback(() => {
    if (pitchQuery.data?.data?.pagination?.hasPrev) {
      const prevPageParams = {
        ...queryParams,
        page: Math.max((queryParams.page || 1) - 1, 1),
      };

      queryClient.prefetchQuery({
        queryKey: PITCH_QUERY_KEYS.published(prevPageParams),
        queryFn: () => pitchService.getPublishedPitches(prevPageParams),
        staleTime: 1000 * 60 * 5,
      });
    }
  }, [queryParams, pitchQuery.data, queryClient]);

  // Auto-prefetch adjacent pages when data loads
  useEffect(() => {
    if (pitchQuery.data && !pitchQuery.isLoading) {
      prefetchNextPage();
      prefetchPreviousPage();
    }
  }, [
    pitchQuery.data,
    pitchQuery.isLoading,
    prefetchNextPage,
    prefetchPreviousPage,
  ]);

  // Manual cache refresh function
  const refreshPitches = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: PITCH_QUERY_KEYS.all });
  }, [queryClient]);

  // Check if user has access to global pitches
  // NEW LOGIC:
  // - Entrepreneurs: Always have global access to VIEW pitches (regardless of subscription)
  // - Investors with subscription: Global access
  // - Investors without subscription: Local access only
  const hasGlobalAccess =
    !userContext || // Fallback for loading state
    userContext?.role === "Entrepreneur" || // Entrepreneurs always see all pitches
    (userContext?.role === "Investor" &&
      userContext?.subscriptionPlan === "Investor Access Plan");
  console.log("hasGlobalAccess value ", hasGlobalAccess);
  return {
    // Data
    pitches: pitchQuery.data?.data?.pitches || [],
    pagination: pitchQuery.data?.data?.pagination || {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      hasNext: false,
      hasPrev: false,
    },
    meta: pitchQuery.data?.data?.meta || {
      premiumCount: 0,
      basicCount: 0,
      filteredCount: 0,
    },

    // Loading states
    isLoading: pitchQuery.isLoading,
    isFetching: pitchQuery.isFetching,
    isError: pitchQuery.isError,
    error: pitchQuery.error,

    // User context
    userContext,
    hasGlobalAccess,
    isLoadingUserContext,

    // Actions
    refetch: pitchQuery.refetch,
    refreshPitches,
    invalidateCache: invalidatePitchCache.mutate,

    // Prefetch helpers
    prefetchNextPage,
    prefetchPreviousPage,

    // Cache info for debugging
    queryKey: PITCH_QUERY_KEYS.published(queryParams),
  };
};

// Hook for transforming pitch data to match PitchCard props
export const useTransformedPitches = (
  filters: PitchFilterState,
  searchQuery: string,
  pagination: { page: number; limit: number }
) => {
  const pitchData = useOptimizedPitches(filters, searchQuery, pagination);

  const transformedPitches = pitchData.pitches.map((pitch) => ({
    id: pitch._id,
    title: pitch.companyInfo?.pitchTitle || "Untitled Pitch",
    company: pitch.companyInfo?.pitchTitle || "Company Name",
    description: pitch.pitchDeal?.summary || "No description available",
    industry: pitch.companyInfo?.industry1 || "General",
    image:
      pitch.media?.banner?.url ||
      pitch.media?.logo?.url ||
      "https://images.pexels.com/photos/9875441/pexels-photo-9875441.jpeg",
    fundingGoal: parseInt(
      pitch.companyInfo?.raisingAmount?.replace(/[^0-9]/g, "") || "0"
    ),
    fundingCurrent: parseInt(
      pitch.companyInfo?.raisedSoFar?.replace(/[^0-9]/g, "") || "0"
    ),
    investors: Math.floor(Math.random() * 100) + 10, // TODO: Get real data
    daysLeft: Math.floor(Math.random() * 60) + 1, // TODO: Calculate from publishedAt
    isPremium: pitch.user?.subscriptionPlan === "Investor Access Plan",
  }));

  return {
    ...pitchData,
    transformedPitches,
  };
};
