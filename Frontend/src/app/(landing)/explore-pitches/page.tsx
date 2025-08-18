"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PitchCard } from "@/components/cards/pitch-card";
import {
  Search,
  RefreshCw,
  ArrowLeft,
  SlidersHorizontal,
  Sparkles,
  Target,
  Filter,
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

const ExplorePitchesPage = () => {
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
    isFetching,

    error,
    userContext,
    hasGlobalAccess,
    isLoadingUserContext,
    refetch,
    refreshPitches,
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

  const getActiveFilterSummary = () => {
    const summaryParts = [];

    if (filters.countries.length > 0) {
      summaryParts.push(`${filters.countries.length} countries`);
    }
    if (filters.industries.length > 0) {
      summaryParts.push(`${filters.industries.length} industries`);
    }
    if (filters.stages.length > 0) {
      summaryParts.push(`${filters.stages.length} stages`);
    }

    if (filters.fundingTypes.length > 0) {
      summaryParts.push(`${filters.fundingTypes.length} funding types`);
    }
    if (
      filters.investmentRange[0] !== 1000 ||
      filters.investmentRange[1] !== 10000000
    ) {
      summaryParts.push("custom investment range");
    }

    return summaryParts.join(", ");
  };

  // Show loading state for user context
  if (isLoadingUserContext && !transformedPitches.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Loading your personalized experience...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Enhanced Header */}
      <div className="relative bg-gradient-to-r from-white via-primary/5 to-accent/5 dark:from-slate-800 dark:via-primary/10 dark:to-accent/10 border-b border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700/25 bg-[size:20px_20px] opacity-50"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-primary/10 to-transparent dark:from-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-radial from-accent/10 to-transparent dark:from-accent/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hover:bg-primary/10"
              >
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-primary to-accent bg-clip-text text-transparent dark:from-white dark:via-primary dark:to-accent">
                Discover Investment Opportunities
              </h1>
              <div className="p-2 bg-accent/10 dark:bg-accent/20 rounded-lg">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
            </div>

            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              {userContext?.role === "Entrepreneur"
                ? "Explore innovative startups and investment opportunities from entrepreneurs worldwide"
                : hasGlobalAccess
                ? "Browse premium investment opportunities from entrepreneurs worldwide"
                : `Discover investment opportunities in ${
                    userContext?.country || "your region"
                  } - upgrade to Investor Access Plan for global reach`}
            </p>

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

      {/* Enhanced Search Header */}
      <div className=" border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 backdrop-blur-lg bg-white/80 dark:bg-slate-800/80">
        <ExploreHeader
          title=""
          subtitle=""
          searchPlaceholder="Search pitches by title, company, industry, or description..."
          onSearch={handleSearch}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Filters Button */}
        <div className="md:hidden mb-6">
          <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="w-full flex items-center gap-2 border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                onClick={() => setShowMobileFilters(true)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Advanced Filters
                {getActiveFilterCount() > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[90%] sm:w-[450px] pt-6 overflow-y-auto"
            >
              <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">
                Filter Pitches
              </h2>
              <PitchFilters
                initialFilters={filters}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
              />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden md:block lg:w-[350px] xl:w-[400px]">
            <div className="sticky top-24">
              <PitchFilters
                initialFilters={filters}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
              />
            </div>
          </div>

          {/* Results Section */}
          <div className="flex-1 min-w-0">
            {/* Results Summary */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg mb-6 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-4">
                  <div className="flex items-center gap-4">
                    <span>
                      Showing{" "}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {transformedPitches.length}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {pagination.totalItems}
                      </span>{" "}
                      pitches
                    </span>
                    {isFetching && (
                      <div className="flex items-center gap-2 text-primary">
                        <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <span className="text-xs">Updating...</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getActiveFilterCount() > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetFilters}
                        className="text-primary hover:text-primary/80 hover:bg-primary/5"
                      >
                        Clear all filters
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={refreshPitches}
                      className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* Show active filters summary */}
                {getActiveFilterCount() > 0 && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 border border-primary/20 dark:border-primary/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Filter className="h-4 w-4 text-primary" />
                      <span className="font-medium text-slate-900 dark:text-white">
                        Active Filters ({getActiveFilterCount()}):
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {getActiveFilterSummary()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Show info about pitch prioritization */}
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
                />
              </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
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

// Types for PitchGrid component props
interface PitchGridProps {
  pitches: Array<{
    id: string;
    title: string;
    company: string;
    description: string;
    industry: string;
    image: string;
    fundingGoal: number;
    fundingCurrent: number;
    investors: number;
    daysLeft: number;
    isPremium?: boolean;
  }>;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

// Enhanced Pitch Grid Component
const PitchGrid = ({ pitches, isLoading, error, refetch }: PitchGridProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="relative">
          <LoadingSpinner />
          <div className="absolute inset-0 animate-ping">
            <div className="w-8 h-8 border-2 border-primary/30 rounded-full"></div>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-400 animate-pulse">
          Discovering amazing opportunities...
        </p>
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
          Unable to load pitches
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          We&apos;re having trouble connecting to our servers. Please try again.
        </p>
        <Button onClick={refetch} className="bg-primary hover:bg-primary/80">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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

export default ExplorePitchesPage;
