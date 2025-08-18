"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import type { PitchInfo } from "@/lib/types/chat";
import type { ViewPitchData } from "@/lib/types/pitch-view";
import { useQuery } from "@tanstack/react-query";
import { pitchService } from "@/services/pitch-service";
import LoadingSpinner from "@/components/ui/loading-spinner";
import ErrorMessage from "@/components/ui/error-message";
import {
  PitchHero,
  PitchNavigation,
  PitchOverview,
  PitchDetails,
  PitchActions,
  PitchTeam,
  PitchDocuments,
  PitchContact,
} from "@/components/pitch/view";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Auth and messages
import { useAuthUser } from "@/hooks/auth/useAuthUser";
import { EntrepreneurUpgradeMessage } from "@/components/pitch/view/EntrepreneurUpgradeMessage";
import { UnauthorizedAccessMessage } from "@/components/pitch/view/UnauthorizedAccessMessage";

const ViewPitchPage = () => {
  const params = useParams();
  const pitchId = params.id as string;
  const [activeSection, setActiveSection] = useState("overview");
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollSpyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Smart fetch strategy: Try user's own pitch first, then public
  const {
    data: pitchResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pitch", pitchId],
    queryFn: async (): Promise<{
      success: boolean;
      message: string;
      data: ViewPitchData;
      restricted?: boolean;
      accessLevel?: "full" | "overview-only";
    }> => {
      try {
        // First try to get user's own pitch (works for any status)
        const ownerResponse = await pitchService.getMyPitchById(pitchId);
        return { ...ownerResponse, restricted: false, accessLevel: "full" };
      } catch (error: unknown) {
        // If that fails (not owner or not authenticated), try public pitch
        const axiosError = error as { response?: { status?: number } };
        if (
          axiosError?.response?.status === 403 ||
          axiosError?.response?.status === 401
        ) {
          return await pitchService.getPitchById(pitchId);
        }
        throw error; // Re-throw other errors
      }
    },
    enabled: !!pitchId,
    retry: 1,
  });

  const pitch = pitchResponse?.data;
  const accessLevel = pitchResponse?.accessLevel;

  // Auth state (lifted to page level so we can decide once)
  const { user, isAuthenticated, loading: authLoading } = useAuthUser();

  // Check if current user is the pitch owner
  const isPitchOwner =
    isAuthenticated && user && pitch && user._id === pitch.userId._id;

  // derive access state once for the whole page
  // possible values: "auth-loading", "unauthenticated", "overview-only", "owner", "investor"
  const accessState = authLoading
    ? "auth-loading"
    : !isAuthenticated || !user
    ? "unauthenticated"
    : isPitchOwner
    ? "owner" // Pitch owner gets full access
    : accessLevel === "overview-only"
    ? "overview-only" // Other entrepreneurs get overview-only access
    : user.role === "Investor"
    ? "investor"
    : "unauthenticated";

  // Handle scroll for navigation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle section scrolling with improved offset calculation
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      // Better offset calculation - account for hero height and navigation
      const navHeight = 80; // Navigation bar height
      const elementPosition =
        element.getBoundingClientRect().top + window.pageYOffset - navHeight;

      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
    }
  };

  // Handle scroll spy for active section with improved detection
  useEffect(() => {
    const handleScrollSpy = () => {
      const sections = [
        "overview",
        "pitch-details",
        "team",
        "documents",
        "contact",
      ];
      const navHeight = 80;

      let currentSection = "overview"; // Default section

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Check if section is in viewport with some tolerance
          if (rect.top <= navHeight + 50 && rect.bottom >= navHeight + 50) {
            currentSection = sectionId;
          }
        }
      }

      if (currentSection !== activeSection) {
        setActiveSection(currentSection);
      }
    };

    const throttledScrollSpy = () => {
      if (scrollSpyTimeoutRef.current) {
        clearTimeout(scrollSpyTimeoutRef.current);
      }
      scrollSpyTimeoutRef.current = setTimeout(handleScrollSpy, 100);
    };

    window.addEventListener("scroll", throttledScrollSpy);
    return () => {
      window.removeEventListener("scroll", throttledScrollSpy);
      if (scrollSpyTimeoutRef.current) {
        clearTimeout(scrollSpyTimeoutRef.current);
      }
    };
  }, [activeSection]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Loading pitch details..." />
      </div>
    );
  }

  if (error || !pitch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <ErrorMessage
          title="Pitch Not Found"
          message="This pitch may not be published yet or doesn't exist."
          action={
            <Button variant="outline" asChild>
              <Link href="/my-pitches">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Pitches
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  // Transform pitch data for chat components
  const chatPitchInfo: PitchInfo = {
    _id: pitch._id,
    companyInfo: {
      pitchTitle: pitch.companyInfo?.pitchTitle || "Untitled Pitch",
      description: pitch.pitchDeal?.summary || "No description available",
      country: pitch.companyInfo?.country || "",
      industry1: pitch.companyInfo?.industry1,
    },
    media: {
      logo: pitch.media?.logo ? { url: pitch.media.logo.url } : undefined,
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      {/* Hero Section with Banner */}
      <PitchHero pitch={pitch} />

      {/* Sticky Navigation */}
      <div className="sticky top-0 z-50">
        <PitchNavigation
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          isScrolled={isScrolled}
          pitch={chatPitchInfo}
          accessLevel={
            accessState === "overview-only" ? "overview-only" : "full"
          }
        />
      </div>

      {/* Main Content */}
      <div className="relative">
        {/* Overview Section - Always visible (wrapped with original access wrapper inside component if needed) */}
        <section id="overview" className="py-12 bg-slate-50 dark:bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <PitchOverview pitch={pitch} />
          </div>
        </section>

        {/* Single-shot access UI for protected content */}
        {accessState === "auth-loading" && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {accessState === "unauthenticated" && (
          <section className="py-12 bg-white dark:bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <UnauthorizedAccessMessage />
            </div>
          </section>
        )}

        {/* For overview-only access, show a message after the overview explaining limited access */}
        {accessState === "overview-only" && (
          <section className="py-12 bg-white dark:bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <EntrepreneurUpgradeMessage isEntrepreneurRestriction={true} />
            </div>
          </section>
        )}

        {/* If user is investor OR pitch owner, render all protected sections */}
        {(accessState === "investor" || accessState === "owner") && (
          <>
            {/* Pitch Details Section */}
            <section
              id="pitch-details"
              className="py-12 bg-white dark:bg-background"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <PitchDetails pitch={pitch} />
              </div>
            </section>

            {/* Actions Section */}
            <PitchActions pitch={chatPitchInfo} />

            {/* Team Section */}
            <section id="team" className="py-12 bg-slate-50 dark:bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <PitchTeam pitch={pitch} />
              </div>
            </section>

            {/* Documents Section */}
            <section
              id="documents"
              className="py-12 bg-white dark:bg-background"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <PitchDocuments pitch={pitch} />
              </div>
            </section>

            {/* Contact/Q&A Section */}
            <section
              id="contact"
              className="py-12 bg-slate-50 dark:bg-background"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <PitchContact pitch={chatPitchInfo} />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewPitchPage;
