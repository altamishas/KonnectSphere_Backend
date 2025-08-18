"use client";

import { useState, useEffect, Suspense } from "react";
import { useDashboardTab } from "@/hooks/useDashboardTab";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pitchService } from "@/services/pitch-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Eye,
  Edit3,
  MoreVertical,
  MapPin,
  TrendingUp,
  Users,
  FileText,
  Settings,
  Building2,
  MessageCircle,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";
import { getCountryName } from "@/lib/utils";

// Import our custom components
import { MyInvestorsComponent } from "@/components/entrepreneur/MyInvestorsComponent";
import { InvestorSearchComponent } from "@/components/search/InvestorSearchComponent";

// Import subscription components
import {
  PitchUsageIndicator,
  PitchUsageIndicatorCompact,
} from "@/components/subscription/SubscriptionIndicator";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";

// Use the existing type from the service for consistency
interface PitchHighlight {
  title: string;
  icon?: string;
}

const DashboardContent = () => {
  const { activeTab, changeTab } = useDashboardTab("my-pitches");
  const [pitchFilterTab, setPitchFilterTab] = useState("all");
  const queryClient = useQueryClient();

  // Cleanup empty drafts mutation
  const cleanupMutation = useMutation({
    mutationFn: () => pitchService.cleanupEmptyDrafts(),
    onSuccess: (data) => {
      if (data.data.deletedCount > 0) {
        console.log(`Cleaned up ${data.data.deletedCount} empty drafts`);
        // Refetch pitches after cleanup
        queryClient.invalidateQueries({ queryKey: ["user-pitches"] });
      }
    },
    onError: (error) => {
      console.error("Failed to cleanup empty drafts:", error);
    },
  });

  // Fetch user's pitches
  const {
    data: pitchesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["user-pitches"],
    queryFn: () => pitchService.getUserPitches(),
    retry: 1,
  });

  // Cleanup empty drafts when component mounts and after pitches are loaded
  useEffect(() => {
    if (pitchesResponse?.data && !cleanupMutation.isPending) {
      // Check if there are any drafts that might be empty
      const hasDrafts = pitchesResponse.data.some(
        (pitch) => pitch.status === "draft"
      );
      if (hasDrafts) {
        cleanupMutation.mutate();
      }
    }
  }, [pitchesResponse?.data]);

  const allPitches = pitchesResponse?.data || [];

  // Filter pitches based on status (simplified to only draft and published)
  const getFilteredPitches = () => {
    switch (pitchFilterTab) {
      case "draft":
        return allPitches.filter((pitch) => pitch.status === "draft");
      case "published":
        return allPitches.filter((pitch) => pitch.status === "published");
      default:
        return allPitches;
    }
  };

  const filteredPitches = getFilteredPitches();

  // Format currency
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (num >= 1000000) {
      return `Rs ${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `Rs ${(num / 1000).toFixed(0)}K`;
    }
    return `Rs ${num.toLocaleString()}`;
  };

  // Get status color (simplified)
  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 border-green-200";
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Render My Pitches Tab Content
  const renderMyPitchesContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-slate-600 dark:text-slate-400">
              Loading your pitches...
            </span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              Error Loading Pitches
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              We couldn&apos;t load your pitches. Please try again.
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600 dark:text-white">
                    Total Pitches
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {allPitches.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600 dark:text-white">
                    Published
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {allPitches.filter((p) => p.status === "published").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600 dark:text-white">
                    Drafts
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {allPitches.filter((p) => p.status === "draft").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs value={pitchFilterTab} onValueChange={setPitchFilterTab}>
          <TabsList>
            <TabsTrigger value="all">All Pitches</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
          </TabsList>

          <TabsContent value={pitchFilterTab} className="mt-6">
            {filteredPitches.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <FileText className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {pitchFilterTab === "all"
                        ? "No pitches yet"
                        : `No ${pitchFilterTab} pitches`}
                    </h3>
                    <p className="text-slate-600 max-w-sm mx-auto">
                      {pitchFilterTab === "all"
                        ? "Get started by creating your first pitch to connect with investors."
                        : `You don&apos;t have any ${pitchFilterTab} pitches at the moment.`}
                    </p>
                    {pitchFilterTab === "all" && (
                      <Button asChild>
                        <Link href="/add-pitch">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Pitch
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPitches.map((pitch) => {
                  const companyInfo = pitch.companyInfo || {};
                  const pitchDeal = pitch.pitchDeal || {};
                  const media = pitch.media || {};

                  return (
                    <Card
                      key={pitch._id}
                      className="hover:shadow-lg transition-all duration-300 group"
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100">
                              {media.logo?.url ? (
                                <Image
                                  src={media.logo.url}
                                  alt={companyInfo.pitchTitle || "Company Logo"}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Building2 className="h-6 w-6 text-slate-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg line-clamp-1">
                                {companyInfo.pitchTitle || "Untitled Pitch"}
                              </CardTitle>
                              {companyInfo.country && (
                                <div className="flex items-center text-sm text-slate-500 mt-1">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {getCountryName(companyInfo.country)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="outline"
                              className={getStatusColor(pitch.status)}
                            >
                              {pitch.status.charAt(0).toUpperCase() +
                                pitch.status.slice(1)}
                            </Badge>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/view-pitch/${pitch._id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Pitch
                                  </Link>
                                </DropdownMenuItem>
                                {pitch.status === "draft" && (
                                  <DropdownMenuItem asChild>
                                    <Link href={`/add-pitch?edit=${pitch._id}`}>
                                      <Edit3 className="h-4 w-4 mr-2" />
                                      Edit Pitch
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <Settings className="h-4 w-4 mr-2" />
                                  Settings
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        {/* Summary */}
                        {pitchDeal.summary && (
                          <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                            {pitchDeal.summary}
                          </p>
                        )}

                        {/* Highlights */}
                        {pitchDeal.highlights &&
                          pitchDeal.highlights.length > 0 && (
                            <div className="space-y-2 mb-4">
                              {pitchDeal.highlights
                                .slice(0, 4)
                                .map(
                                  (
                                    highlight: PitchHighlight,
                                    index: number
                                  ) => (
                                    <div
                                      key={index}
                                      className="flex items-center text-xs text-slate-600"
                                    >
                                      <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                                      {highlight.title}
                                    </div>
                                  )
                                )}
                            </div>
                          )}

                        {/* Funding Info */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-slate-500">Target</p>
                            <p className="font-bold text-primary">
                              {formatCurrency(companyInfo.raisingAmount || "0")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">
                              Min per Investor
                            </p>
                            <p className="font-bold">
                              {formatCurrency(
                                companyInfo.minimumInvestment || "0"
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Industries */}
                        <div className="flex flex-wrap gap-1 mb-4">
                          {companyInfo.industry1 && (
                            <Badge variant="secondary" className="text-xs">
                              {companyInfo.industry1}
                            </Badge>
                          )}
                          {companyInfo.industry2 && (
                            <Badge variant="secondary" className="text-xs">
                              {companyInfo.industry2}
                            </Badge>
                          )}
                          {companyInfo.stage && (
                            <Badge variant="outline" className="text-xs">
                              {companyInfo.stage}
                            </Badge>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            asChild
                          >
                            <Link href={`/view-pitch/${pitch._id}`}>
                              <Eye className="h-3 w-3 mr-1" />
                              View Pitch
                            </Link>
                          </Button>
                          {pitch.status === "draft" ? (
                            <Button size="sm" className="flex-1" asChild>
                              <Link href={`/add-pitch?edit=${pitch._id}`}>
                                <Edit3 className="h-3 w-3 mr-1" />
                                Edit Pitch
                              </Link>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              disabled
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              Published
                            </Button>
                          )}
                        </div>

                        {/* Last Updated */}
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-xs text-slate-400">
                            Last updated:{" "}
                            {new Date(pitch.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 lg:space-x-8 min-w-0 flex-1">
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white whitespace-nowrap">
                Entrepreneur Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="hidden sm:block">
                <PitchUsageIndicatorCompact />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
        {/* Mobile Pitch Usage Indicator */}
        <div className="sm:hidden mb-4 flex justify-center">
          <PitchUsageIndicator />
        </div>

        {/* Subscription Status Banner */}
        <div className="mb-6">
          <SubscriptionBanner showDetails={false} />
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={changeTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="my-pitches"
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>My Pitches</span>
            </TabsTrigger>
            <TabsTrigger
              value="my-investors"
              className="flex items-center space-x-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>My Investors</span>
            </TabsTrigger>
            <TabsTrigger
              value="investor-search"
              className="flex items-center space-x-2"
            >
              <Search className="h-4 w-4" />
              <span>Investor Search</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-pitches">
            {renderMyPitchesContent()}
          </TabsContent>

          <TabsContent value="my-investors">
            <MyInvestorsComponent />
          </TabsContent>

          <TabsContent value="investor-search" className="!mx-0 !px-0">
            <div className="w-full -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-12">
              <InvestorSearchComponent
                showHeader={false}
                className="bg-transparent"
                fullWidth={true}
                forceMobileFilters={true}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const EntrepreneurDashboard = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <DashboardContent />
  </Suspense>
);

export default EntrepreneurDashboard;
