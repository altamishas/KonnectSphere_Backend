"use client";

import { useState } from "react";
import ExploreHeader from "@/components/explore/ExploreHeader";
import InvestorFilters from "@/components/search/InvestorFilters";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, RefreshCw } from "lucide-react";
import { useInvestorSearch } from "@/hooks/investor/useInvestorSearch";
import { InvestorCard } from "@/components/cards/investor-card";
import { Pagination } from "@/components/ui/pagination";

interface InvestorSearchComponentProps {
  showHeader?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
  fullWidth?: boolean; // New prop to control layout\
  forceMobileFilters?: boolean;
}

export const InvestorSearchComponent = ({
  showHeader = true,
  title = "Find Investors",
  subtitle = "Search and connect with investors who match your startup's needs",
  className = "",
  fullWidth = false, // Default to false for backward compatibility
  forceMobileFilters = false, // New prop to control filter visibility
}: InvestorSearchComponentProps) => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const {
    filters,
    investors,
    total,
    pagination,
    isLoading,
    handleSearch,
    applyFilters,
    resetFilters,
    setPage,
  } = useInvestorSearch();

  // Transform investors to match InvestorCardProps
  const transformedInvestors = investors.map((investor) => ({
    id: investor.id,
    name: investor.name,
    avatar: investor.avatar,
    location: investor.location,
    bio: investor.bio,
    industries: investor.interests?.map((interest) => interest.name) || [],
    investmentRange: investor.investmentRange,
    totalInvestments: investor.pastInvestments || 0,
    verified: investor.verified || false,
  }));

  return (
    <div className={className}>
      {showHeader && (
        <ExploreHeader
          title={title}
          subtitle={subtitle}
          searchPlaceholder="Search by name, industries, expertise, languages, countries, investment stages..."
          onSearch={handleSearch}
        />
      )}

      <div
        className={
          fullWidth
            ? "w-full px-4 sm:px-6 lg:px-8 py-6"
            : "container mx-auto px-4 py-8"
        }
      >
        <div className="md:hidden mb-4">
          <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
            <SheetTrigger asChild>
              {forceMobileFilters && (
                <div className="hidden lg:block mb-4">
                  <Button
                    variant="outline"
                    className="w-full flex items-center gap-2"
                    onClick={() => setShowMobileFilters(true)}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </Button>
                </div>
              )}
            </SheetTrigger>
            <SheetContent side="left" className="w-[85%] sm:w-[350px] pt-6">
              <h2 className="text-lg font-semibold mb-4 p-4">Filters</h2>
              <InvestorFilters
                initialFilters={filters}
                onApplyFilters={applyFilters}
                onResetFilters={resetFilters}
              />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {!forceMobileFilters && (
            <div
              className={`hidden lg:block ${
                fullWidth ? "lg:w-1/5 xl:w-1/6" : "md:w-1/4 lg:w-1/5"
              }`}
            >
              <InvestorFilters
                initialFilters={filters}
                onApplyFilters={applyFilters}
                onResetFilters={resetFilters}
              />
            </div>
          )}

          {/* Enhanced main content area - larger width allocation */}
          <div className={`${fullWidth && " mx-auto px-4 "}`}>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <div className="text-slate-700 dark:text-slate-300">
                  {total} {total === 1 ? "investor" : "investors"} found
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => setShowMobileFilters(true)}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                    </Button>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : investors.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                    No investors found
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    No investors match your current search and filter criteria.
                    Try:
                  </p>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 mb-4 space-y-1">
                    <li>
                      • Using different search terms (name, industries,
                      expertise, etc.)
                    </li>
                    <li>• Adjusting or removing some filters</li>
                    <li>
                      • Checking if you have access to global investors (upgrade
                      plan)
                    </li>
                    <li>
                      • Broadening your investment range or stage criteria
                    </li>
                  </ul>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={resetFilters}>
                      Reset All Filters
                    </Button>
                    <Button asChild>
                      <a href="/pricing">Upgrade Plan</a>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {/* Enhanced grid with better responsiveness - max 3 cards per row for optimal UX */}
                    <div
                      className={`grid place-items-center ${
                        fullWidth
                          ? "gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                          : "gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                      }`}
                    >
                      {transformedInvestors.map((investor) => (
                        <InvestorCard key={investor.id} {...investor} />
                      ))}
                    </div>
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="mt-8">
                      <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        totalItems={pagination.total}
                        itemsPerPage={pagination.limit}
                        onPageChange={setPage}
                        isLoading={isLoading}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
