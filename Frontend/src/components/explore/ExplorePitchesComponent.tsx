"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PitchCard } from "@/components/cards/pitch-card";
import {
  Search,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Target,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import ExploreHeader from "@/components/explore/ExploreHeader";
import PitchFilters, {
  PitchFilterState,
} from "@/components/explore/PitchFilters";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTransformedPitches } from "@/hooks/pitch/useOptimizedPitches";
import Link from "next/link";
import { SubscriptionPrompt } from "@/components/subscription/SubscriptionPrompt";
import { Pagination } from "@/components/ui/pagination";

interface ExplorePitchesComponentProps {
  showHeader?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
  fullWidth?: boolean;
}

export const ExplorePitchesComponent = ({
  showHeader = true,
  title = "Explore Pitches",
  subtitle = "Discover innovative startups and investment opportunities",
  className = "",
  fullWidth = false,
}: ExplorePitchesComponentProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const itemsPerPage = 12;

  // Initial filter state
  const [filters, setFilters] = useState<PitchFilterState>({
    investmentRange: [1000, 10000000],
    countries: [],
    industries: [],
    stages: [],
    fundingTypes: [],
  });

  // Use the optimized pitch hook
  const {
    transformedPitches,
    pagination,
    meta,
    isLoading,
    error,
    userContext,
    hasGlobalAccess,
    refetch,
    prefetchNextPage,
    prefetchPreviousPage,
  } = useTransformedPitches(filters, searchQuery, {
    page: currentPage,
    limit: itemsPerPage,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleApplyFilters = (newFilters: PitchFilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setShowMobileFilters(false);
  };

  const handleResetFilters = () => {
    const resetFilters: PitchFilterState = {
      investmentRange: [1000, 10000000],
      countries: [],
      industries: [],
      stages: [],
      fundingTypes: [],
    };
    setFilters(resetFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Prefetch adjacent pages for better UX
    if (page < pagination.totalPages) {
      prefetchNextPage();
    }
    if (page > 1) {
      prefetchPreviousPage();
    }
  };

  const getActiveFilterCount = () => {
    return (
      filters.countries.length +
      filters.industries.length +
      filters.stages.length +
      filters.fundingTypes.length +
      (filters.investmentRange[0] !== 1000 ||
      filters.investmentRange[1] !== 10000000
        ? 1
        : 0)
    );
  };

  return (
    <div className={className}>
      {showHeader && (
        <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 dark:from-primary/10 dark:via-accent/10 dark:to-primary/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
          <div className="relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
              <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                  {title}
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                  {subtitle}
                </p>
              </div>

              <div className="flex items-center justify-center space-x-6 mt-6">
                <Badge
                  variant="outline"
                  className="px-4 py-2 text-base border-primary/20 bg-primary/5"
                >
                  <Target className="h-4 w-4 mr-2 text-primary" />
                  {pagination.totalItems} Active Pitches
                </Badge>
                {userContext?.role === "Investor" && !hasGlobalAccess && (
                  <Badge
                    variant="outline"
                    className="px-4 py-2 text-base border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                  >
                    Local Access Only - Upgrade for Global View
                  </Badge>
                )}
                {userContext?.role === "Entrepreneur" && (
                  <Badge
                    variant="outline"
                    className="px-4 py-2 text-base border-green-200 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400"
                  >
                    Global Viewing Access
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="px-4 py-2 text-base border-accent/20 bg-accent/5"
                >
                  <Sparkles className="h-4 w-4 mr-2 text-accent" />
                  Smart Filtering
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Search Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 backdrop-blur-lg bg-white/80 dark:bg-slate-800/80">
        <ExploreHeader
          title=""
          subtitle=""
          searchPlaceholder="Search pitches by title, company, industry, or description..."
          onSearch={handleSearch}
        />
      </div>

      {/* Main Content */}
      <div
        className={
          fullWidth
            ? "w-full px-4 sm:px-6 lg:px-8 py-6"
            : "container mx-auto px-4 py-8"
        }
      >
        <div className="lg:hidden mb-4">
          <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={() => setShowMobileFilters(true)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85%] sm:w-[350px] pt-6">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>
              <PitchFilters
                initialFilters={filters}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
              />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Enhanced filter sidebar */}
          <div
            className={`hidden lg:block ${
              fullWidth ? "lg:w-1/5 xl:w-1/6" : "lg:w-1/4"
            }`}
          >
            <div className="sticky top-32">
              <PitchFilters
                initialFilters={filters}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
              />
            </div>
          </div>

          {/* Enhanced main content area */}
          <div className={`${fullWidth ? "lg:w-4/5 xl:w-5/6" : "lg:w-3/4"}`}>
            <div className="space-y-6">
              {userContext && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Showing all {meta.premiumCount + meta.basicCount}{" "}
                      published pitches
                      {userContext.role === "Investor"
                        ? " (global investor access)"
                        : ""}
                    </span>
                    {meta.premiumCount > 0 && (
                      <span className="text-xs mt-1 block">
                        ✨ Premium pitches are prioritized and shown first
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Show subscription prompt for investors without global access */}
              {userContext?.role === "Investor" && !hasGlobalAccess && (
                <div className="mb-6">
                  <SubscriptionPrompt
                    type="investor-global"
                    userCountry={userContext?.country}
                  />
                </div>
              )}

              <PitchGrid
                pitches={transformedPitches}
                isLoading={isLoading}
                error={error}
                refetch={refetch}
                fullWidth={fullWidth}
              />
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface PitchGridProps {
  pitches: any[];
  isLoading: boolean;
  error: any;
  refetch: () => void;
  fullWidth?: boolean;
}

const PitchGrid = ({
  pitches,
  isLoading,
  error,
  refetch,
  fullWidth = false,
}: PitchGridProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Failed to load pitches
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          There was an error loading the pitches. Please try again.
        </p>
        <Button onClick={refetch}>Try Again</Button>
      </div>
    );
  }

  if (pitches.length === 0) {
    return (
      <div className="text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          No pitches found
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          No pitches match your current search criteria. Try adjusting your
          filters or search terms.
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reset Search
          </Button>
          <Button asChild>
            <Link href="/add-pitch">Create Pitch</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-6 ${
        fullWidth
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
      }`}
    >
      {pitches.map((pitch, index) => (
        <div
          key={pitch.id}
          className="transform transition-all duration-300 hover:scale-[1.02] opacity-0 animate-fade-in relative"
          style={{
            animationDelay: `${index * 100}ms`,
            animationFillMode: "forwards",
          }}
        >
          {pitch.isPremium && (
            <div className="absolute top-2 right-2 z-10">
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold shadow-lg">
                <Sparkles className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            </div>
          )}
          <PitchCard {...pitch} />
        </div>
      ))}
    </div>
  );
};
