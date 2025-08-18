"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Heart, ThumbsUp } from "lucide-react";
import { useAuthUser } from "@/hooks/auth/useAuthUser";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { PitchInfo } from "@/lib/types/chat";
import { useFavouritePitch } from "@/hooks/pitch/useFavouritePitch";

interface PitchActionsProps {
  pitch: PitchInfo;
}

const PitchActions = ({ pitch }: PitchActionsProps) => {
  const { isAuthenticated, user } = useAuthUser();
  const router = useRouter();
  const [isMarkingInterested, setIsMarkingInterested] = useState(false);
  const askQuestionButtonRef = useRef<HTMLButtonElement>(null);
  const {
    isInFavorites,
    isLoading: isFavoriteLoading,
    toggleFavorite,
  } = useFavouritePitch(pitch._id);

  const handleAddToFavorites = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to add pitches to favorites");
      router.push("/login");
      return;
    }

    if (user?.role !== "Investor") {
      toast.error("Only investors can add pitches to favorites");
      return;
    }

    toggleFavorite();
  };

  const handleMarkInterested = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to mark interest in pitches");
      router.push("/login");
      return;
    }

    if (user?.role !== "Investor") {
      toast.error("Only investors can mark interest in pitches");
      return;
    }

    setIsMarkingInterested(true);
    try {
      // This will trigger the Ask Question flow
      askQuestionButtonRef.current?.click();
    } catch {
      toast.error("Failed to mark interest. Please try again.");
    } finally {
      setIsMarkingInterested(false);
    }
  };

  return (
    <section className="bg-primary py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-white text-center text-2xl m-4">
          What do you think about this project?
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="lg"
              className="min-w-[200px] bg-white hover:bg-gray-100 text-primary"
              onClick={handleAddToFavorites}
              disabled={isFavoriteLoading}
            >
              <Heart
                className={`h-5 w-5 mr-2 ${
                  isInFavorites ? "fill-current" : ""
                }`}
              />
              {isInFavorites ? "Remove from Favorites" : "Add to Favorites"}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="min-w-[200px] bg-white hover:bg-gray-100 text-primary"
              onClick={handleMarkInterested}
              disabled={isMarkingInterested}
            >
              <ThumbsUp className="h-5 w-5 mr-2" />
              Interested
            </Button>
          </div>
          <button
            ref={askQuestionButtonRef}
            className="hidden"
            onClick={() => {
              const askQuestionButton = document.querySelector(
                '[data-ask-question="true"]'
              ) as HTMLButtonElement;
              if (askQuestionButton) {
                askQuestionButton.click();
              }
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default PitchActions;
