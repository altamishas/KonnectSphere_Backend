"use client";

import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Target, Search } from "lucide-react";

// Import subscription components
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";
import { SubscriptionIndicator } from "@/components/subscription/SubscriptionIndicator";

// Import custom components (to be created)
import { MyPortfolioComponent } from "@/components/investor/MyPortfolioComponent";
import { PreferredPitchesComponent } from "@/components/investor/PreferredPitchesComponent";
import { ExplorePitchesComponent } from "@/components/explore/ExplorePitchesComponent";

// Import dashboard tab hook
import { useDashboardTab } from "@/hooks/useDashboardTab";

// type DashboardTab = "my-portfolio" | "preferred-pitches" | "explore-pitches";

// Create a wrapper component for the dashboard content
const DashboardContent = () => {
  const { activeTab, changeTab } = useDashboardTab("my-portfolio");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 lg:space-x-8 min-w-0 flex-1">
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white whitespace-nowrap">
                Investor Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="hidden sm:block">
                <SubscriptionIndicator variant="badge" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
        {/* Mobile Subscription Indicator */}
        <div className="sm:hidden mb-4 flex justify-center">
          <SubscriptionIndicator variant="full" />
        </div>

        {/* Subscription Status Banner */}
        <div className="mb-6">
          <SubscriptionBanner showDetails={false} />
        </div>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => changeTab(value)}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="my-portfolio"
              className="flex items-center space-x-2"
            >
              <Briefcase className="h-4 w-4" />
              <span>My Portfolio</span>
            </TabsTrigger>
            <TabsTrigger
              value="preferred-pitches"
              className="flex items-center space-x-2"
            >
              <Target className="h-4 w-4" />
              <span>Preferred Pitches</span>
            </TabsTrigger>
            <TabsTrigger
              value="explore-pitches"
              className="flex items-center space-x-2"
            >
              <Search className="h-4 w-4" />
              <span>Explore Pitches</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-portfolio">
            <MyPortfolioComponent />
          </TabsContent>

          <TabsContent value="preferred-pitches">
            <PreferredPitchesComponent />
          </TabsContent>

          <TabsContent value="explore-pitches" className="!mx-0 !px-0">
            <ExplorePitchesComponent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Main component with Suspense boundary
const InvestorDashboard = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
};

export default InvestorDashboard;
