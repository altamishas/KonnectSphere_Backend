"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import favouritesService from "@/services/favourites-service";
import type { FavouriteStatusResponse } from "@/services/favourites-service";
import { toast } from "sonner";
import { useAuthUser } from "@/hooks/auth/useAuthUser";

interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const useFavouritePitch = (pitchId: string) => {
  const queryClient = useQueryClient();
  const [isInFavorites, setIsInFavorites] = useState(false);
  const { isAuthenticated } = useAuthUser();

  // Check if pitch is in favorites
  const { data: checkResult, isLoading: checkingFavorite } =
    useQuery<FavouriteStatusResponse>({
      queryKey: ["check-favorite", pitchId],
      queryFn: () => favouritesService.checkFavouriteStatus(pitchId),
      enabled: !!pitchId && isAuthenticated,
      retry: false, // Don't retry on 401
    });

  // Update local state when data is fetched
  useEffect(() => {
    if (checkResult?.data?.isFavourite !== undefined) {
      setIsInFavorites(checkResult.data.isFavourite);
    }
  }, [checkResult]);

  // Add to favorites mutation
  const { mutate: addToFavorites, isPending: isAdding } = useMutation({
    mutationFn: () => favouritesService.addToFavourites(pitchId),
    onSuccess: () => {
      setIsInFavorites(true);
      toast.success("Added to favorites!");
      queryClient.invalidateQueries({ queryKey: ["check-favorite", pitchId] });
    },
    onError: (error: unknown) => {
      const err = error as ErrorResponse;
      toast.error(err?.response?.data?.message || "Failed to add to favorites");
    },
  });

  // Remove from favorites mutation
  const { mutate: removeFromFavorites, isPending: isRemoving } = useMutation({
    mutationFn: () => favouritesService.removeFromFavourites(pitchId),
    onSuccess: () => {
      setIsInFavorites(false);
      toast.success("Removed from favorites");
      queryClient.invalidateQueries({ queryKey: ["check-favorite", pitchId] });
    },
    onError: (error: unknown) => {
      const err = error as ErrorResponse;
      toast.error(
        err?.response?.data?.message || "Failed to remove from favorites"
      );
    },
  });

  const toggleFavorite = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to add pitches to favorites");
      return;
    }

    if (isInFavorites) {
      removeFromFavorites();
    } else {
      addToFavorites();
    }
  };

  return {
    isInFavorites,
    isLoading: checkingFavorite || isAdding || isRemoving,
    toggleFavorite,
  };
};
