"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Hexagon, StarIcon } from "lucide-react";
import Link from "next/link";
import { InvestorCard } from "@/components/cards/investor-card";
import { cn } from "@/lib/utils";
import { InvestorCardProps, User } from "@/lib/types";
import { investorService } from "@/services/investor-service";

export default function FeaturedInvestors() {
  const [visibleInvestors, setVisibleInvestors] = useState<InvestorCardProps[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedInvestors();
  }, []);

  const fetchFeaturedInvestors = async () => {
    try {
      setLoading(true);
      const premiumInvestors = await investorService.getFeaturedInvestors();

      // Transform User data to InvestorCardProps
      const transformedInvestors: InvestorCardProps[] = premiumInvestors
        .filter((investor: User) => investor.role === "Investor")
        .slice(0, 4) // Limit to 4 investors for the featured section
        .map((investor: User) => ({
          id: investor._id,
          name: investor.fullName,
          avatar: investor.avatarImage?.url || "/images/avatar.png",
          location: `${investor.cityName || "Lahore"}, ${
            investor.countryName || "Pakistan"
          }`,
          bio:
            investor.profileInfo?.aboutMe ||
            investor.bio ||
            "Experienced investor looking for innovative startups.",
          industries: investor.investmentPreferences?.interestedIndustries ||
            investor.preferredIndustries || ["Technology", "Software"],
          investmentRange: `$${(
            investor.investmentPreferences?.investmentRangeMin || 1000
          ).toLocaleString()} - $${(
            investor.investmentPreferences?.investmentRangeMax || 100000
          ).toLocaleString()}`,
          totalInvestments:
            investor.profileInfo?.previousInvestments ||
            investor.pastInvestments ||
            0,
          verified: investor.isEmailVerified || false,
        }));

      // Animate the investors appearing one by one
      setVisibleInvestors([]);

      const timer = setTimeout(() => {
        setVisibleInvestors(transformedInvestors.slice(0, 1));
      }, 500);

      const interval = setInterval(() => {
        setVisibleInvestors((prev) => {
          const nextCount = prev.length + 1;
          if (nextCount <= transformedInvestors.length) {
            return transformedInvestors.slice(0, nextCount);
          }
          clearInterval(interval);
          return prev;
        });
      }, 300);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    } catch (error) {
      console.error("Error fetching featured investors:", error);
      // Fallback to empty array on error
      setVisibleInvestors([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 md:py-24 bg-muted/30 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Hexagon className="absolute text-primary/5 h-64 w-64 -top-20 -left-20 rotate-12" />
        <Hexagon className="absolute text-primary/5 h-72 w-72 -bottom-20 -right-20 rotate-45" />
        <StarIcon className="absolute text-primary/5 h-32 w-32 top-1/3 right-1/4 rotate-12" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Featured Premium Investors
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Connect with verified premium investors who have a proven track
            record of supporting successful ventures and are actively looking
            for new opportunities.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-80 bg-muted/40 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : visibleInvestors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleInvestors.map((investor, index) => (
              <div
                key={investor.id}
                className={cn(
                  "opacity-0 translate-y-4 transition-all duration-500",
                  {
                    "opacity-100 translate-y-0": true,
                    "transition-delay-100": index === 0,
                    "transition-delay-200": index === 1,
                    "transition-delay-300": index === 2,
                    "transition-delay-400": index === 3,
                  }
                )}
                style={{
                  transitionDelay: `${index * 100}ms`,
                  opacity: 1,
                  transform: "translateY(0)",
                }}
              >
                <InvestorCard {...investor} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No premium investors available at the moment.
            </p>
          </div>
        )}

        <div className="mt-10 text-center">
          <Button asChild variant="outline" className="border-primary">
            <Link href="/search-investors">
              View All Investors
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
