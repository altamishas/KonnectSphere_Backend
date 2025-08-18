"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PitchCard } from "@/components/cards/pitch-card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { pitchService } from "@/services/pitch-service";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function FeaturedInvestments() {
  const [activeTab, setActiveTab] = useState("trending");

  // Fetch featured pitches for the active tab
  const {
    data: featuredPitchesResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["featured-pitches", activeTab],
    queryFn: () => pitchService.getFeaturedPitches(activeTab),
    retry: 1,
  });

  const featuredPitches = featuredPitchesResponse?.data || [];

  // Transform pitch data to match PitchCard props and limit to 3 for homepage
  const transformedPitches = featuredPitches.slice(0, 3).map((pitch) => ({
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
    investors: Math.floor(Math.random() * 100) + 10, // Mock data - replace with real investor count
    daysLeft: Math.floor(Math.random() * 60) + 1, // Mock data - replace with real days left
  }));

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold mb-4 text-foreground">
            Featured Investment Opportunities
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover promising ventures from premium users across various
            industries, carefully curated by our team of experts.
          </p>
        </div>

        <Tabs
          defaultValue="trending"
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger
                value="trending"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Trending
              </TabsTrigger>
              <TabsTrigger
                value="newest"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Newest (4hrs)
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="text-center text-muted-foreground">
                <p>Unable to load featured investments at the moment.</p>
                <p className="text-sm mt-2">Please try again later.</p>
              </div>
            ) : transformedPitches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {transformedPitches.map((pitch) => (
                  <PitchCard key={pitch.id} {...pitch} />
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>No featured investments available for this category.</p>
                <p className="text-sm mt-2">
                  Check back soon for new opportunities!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-10 text-center">
          <Button
            asChild
            variant="outline"
            className="border-primary hover:bg-primary/10"
          >
            <Link href="/explore-pitches">
              Explore All Pitches
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
