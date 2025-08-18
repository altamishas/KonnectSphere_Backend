"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Target,
  RefreshCw,
  Search,
  Settings,
  AlertCircle,
  Building2,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import Link from "next/link";
import Image from "next/image";

// Import types
import type { PreferredPitch } from "@/services/preferred-pitches-service";

// Import services
import preferredPitchesService from "@/services/preferred-pitches-service";

export const PreferredPitchesComponent = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Fetch preferred pitches
  const {
    data: pitchesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["preferred-pitches", currentPage],
    queryFn: () =>
      preferredPitchesService.getPreferredPitches(currentPage, itemsPerPage),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Type for error response
  interface ErrorResponse {
    response?: {
      status?: number;
    };
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    const isPreferencesError =
      (error as ErrorResponse)?.response?.status === 404;

    return (
      <div className="text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12">
        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          {isPreferencesError ? (
            <Settings className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          ) : (
            <RefreshCw className="h-8 w-8 text-red-600 dark:text-red-400" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          {isPreferencesError
            ? "Preferences Not Set"
            : "Failed to load pitches"}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          {isPreferencesError
            ? "Please set your investment preferences in your account settings to see personalized pitch recommendations."
            : "There was an error loading your preferred pitches. Please try again."}
        </p>
        <div className="flex justify-center gap-2">
          {isPreferencesError ? (
            <Button asChild>
              <Link href="/account?tab=ideal-investment">
                <Settings className="h-4 w-4 mr-2" />
                Set Preferences
              </Link>
            </Button>
          ) : (
            <Button onClick={() => refetch()}>Try Again</Button>
          )}
        </div>
      </div>
    );
  }

  const pitches = pitchesData?.data || [];
  const preferences = pitchesData?.meta?.preferences;

  if (pitches.length === 0) {
    return (
      <div className="space-y-6">
        {preferences && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                Your Investment Preferences
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800 dark:text-blue-200">
                  Investment Range:
                </span>
                <p className="text-blue-700 dark:text-blue-300">
                  {preferences.investmentRange}
                </p>
              </div>
              <div>
                <span className="font-medium text-blue-800 dark:text-blue-200">
                  Industries:
                </span>
                <p className="text-blue-700 dark:text-blue-300">
                  {preferences.industries}
                </p>
              </div>
              <div>
                <span className="font-medium text-blue-800 dark:text-blue-200">
                  Countries:
                </span>
                <p className="text-blue-700 dark:text-blue-300">
                  {preferences.countries}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No matching pitches found
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            No pitches currently match your investment preferences. Try
            adjusting your preferences or explore all available pitches.
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/account?tab=ideal-investment">
                <Settings className="h-4 w-4 mr-2" />
                Update Preferences
              </Link>
            </Button>
            <Button asChild>
              <Link href="/explore-pitches">
                <Search className="h-4 w-4 mr-2" />
                Explore All Pitches
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Preferred Pitches
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Pitches tailored to your investment preferences
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/account?tab=ideal-investment">
              <Settings className="h-4 w-4 mr-2" />
              Update Preferences
            </Link>
          </Button>
        </div>

        {preferences && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h3 className="font-medium text-green-900 dark:text-green-100">
                Your Investment Preferences
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-800 dark:text-green-200">
                  Investment Range:
                </span>
                <p className="text-green-700 dark:text-green-300">
                  {preferences.investmentRange}
                </p>
              </div>
              <div>
                <span className="font-medium text-green-800 dark:text-green-200">
                  Industries:
                </span>
                <p className="text-green-700 dark:text-green-300">
                  {preferences.industries}
                </p>
              </div>
              <div>
                <span className="font-medium text-green-800 dark:text-green-200">
                  Countries:
                </span>
                <p className="text-green-700 dark:text-green-300">
                  {preferences.countries}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-6">
          <Badge variant="outline" className="px-3 py-1">
            <Target className="h-4 w-4 mr-2" />
            {pitchesData?.pagination.total || 0} Matching Pitches
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pitches.map((pitch: PreferredPitch) => (
            <Card
              key={pitch.id}
              className="overflow-hidden transition-all duration-300 hover:shadow-md border border-border/60 group h-full flex flex-col"
            >
              {/* Pitch Image */}
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={
                    (
                      pitch.media as {
                        banner?: { url: string };
                        logo?: { url: string };
                      }
                    )?.banner?.url ||
                    (
                      pitch.media as {
                        banner?: { url: string };
                        logo?: { url: string };
                      }
                    )?.logo?.url ||
                    "/images/pic1.jpg"
                  }
                  alt={pitch.title}
                  fill
                  style={{ objectFit: "cover" }}
                  className="group-hover:scale-105 transition-transform duration-500"
                />
                <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground hover:bg-primary/90">
                  {pitch.industry}
                </Badge>
                {pitch.isPremium && (
                  <Badge className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    Premium
                  </Badge>
                )}
              </div>

              <CardContent className="p-5 flex-grow">
                <div className="mb-2 mt-1">
                  <h3 className="text-xl font-semibold line-clamp-1 text-foreground">
                    {pitch.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {pitch.entrepreneur.name}
                  </p>
                </div>

                <p className="text-sm line-clamp-2 mb-4 text-foreground">
                  {pitch.description}
                </p>

                <div className="space-y-3">
                  {/* Funding Information */}
                  <div>
                    <div className="flex justify-between text-sm mb-1 text-foreground">
                      <span>${pitch.fundingRaised.toLocaleString()}</span>
                      <span>${pitch.fundingGoal.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${Math.min(
                            (pitch.fundingRaised / pitch.fundingGoal) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>
                        {Math.round(
                          (pitch.fundingRaised / pitch.fundingGoal) * 100
                        )}
                        % Funded
                      </span>
                      <span>{pitch.stage}</span>
                    </div>
                  </div>

                  {/* Entrepreneur Info */}
                  <div className="flex items-center">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={pitch.entrepreneur.avatar} />
                      <AvatarFallback className="text-xs">
                        {pitch.entrepreneur.name?.charAt(0) || "E"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {pitch.entrepreneur.name}
                    </span>
                  </div>

                  {/* Additional Details */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Country:</span>
                      <span className="ml-1 text-foreground font-medium">
                        {pitch.country}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Industry:</span>
                      <span className="ml-1 text-foreground font-medium">
                        {pitch.industry}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>

              <div className="p-5 pt-0 flex gap-2">
                <Button className="flex-1" asChild>
                  <Link href={`/view-pitch/${pitch.id}`}>
                    <Building2 className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {pitchesData && pitchesData.pagination.totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={pitchesData.pagination.page}
              totalPages={pitchesData.pagination.totalPages}
              totalItems={pitchesData.pagination.total}
              itemsPerPage={pitchesData.pagination.limit}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
};
