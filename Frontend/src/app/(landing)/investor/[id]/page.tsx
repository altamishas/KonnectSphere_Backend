"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  MapPin,
  Calendar,
  Users,
  Globe,
  Building2,
  DollarSign,
  Target,
  Tag,
  Flag,
  Wheat,
  GraduationCap,
  Zap,
  Gamepad2,
  Shirt,
  BadgeDollarSign,
  UtensilsCrossed,
  Coffee,
  Cog,
  Camera,
  HeartPulse,
  Scissors,
  Package,
  Home,
  ShoppingBag,
  TrendingUp,
  Code2,
  Laptop,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { investorService } from "@/services/investor-service";
import { User } from "@/lib/types";
import { INDUSTRIES, type Industry } from "@/lib/constants";
import LoadingSpinner from "@/components/ui/loading-spinner";

// Dynamic icon mapper - same as in industries component
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wheat,
  Building2,
  GraduationCap,
  Zap,
  Gamepad2,
  Shirt,
  BadgeDollarSign,
  UtensilsCrossed,
  Coffee,
  Cog,
  Camera,
  HeartPulse,
  Scissors,
  Package,
  Home,
  ShoppingBag,
  TrendingUp,
  Code2,
  Laptop,
  Truck,
};

// Helper function to get color classes
const getColorClasses = (color: string) => {
  const colorMap: Record<string, { text: string; bg: string }> = {
    green: { text: "text-green-600", bg: "bg-green-50" },
    blue: { text: "text-blue-600", bg: "bg-blue-50" },
    purple: { text: "text-purple-600", bg: "bg-purple-50" },
    yellow: { text: "text-yellow-600", bg: "bg-yellow-50" },
    pink: { text: "text-pink-600", bg: "bg-pink-50" },
    rose: { text: "text-rose-600", bg: "bg-rose-50" },
    emerald: { text: "text-emerald-600", bg: "bg-emerald-50" },
    orange: { text: "text-orange-600", bg: "bg-orange-50" },
    amber: { text: "text-amber-600", bg: "bg-amber-50" },
    gray: { text: "text-gray-600", bg: "bg-gray-50" },
    violet: { text: "text-violet-600", bg: "bg-violet-50" },
    red: { text: "text-red-600", bg: "bg-red-50" },
    indigo: { text: "text-indigo-600", bg: "bg-indigo-50" },
    cyan: { text: "text-cyan-600", bg: "bg-cyan-50" },
    stone: { text: "text-stone-600", bg: "bg-stone-50" },
    slate: { text: "text-slate-600", bg: "bg-slate-50" },
    zinc: { text: "text-zinc-600", bg: "bg-zinc-50" },
  };

  return colorMap[color] || { text: "text-gray-600", bg: "bg-gray-50" };
};

// Helper function to render industry icon
const renderIndustryIcon = (industryName: string) => {
  // Find the industry in our constants
  const industry = INDUSTRIES.find(
    (ind: Industry) => ind.name === industryName
  );

  if (!industry) {
    // Fallback for unknown industries
    return (
      <div className="p-2 bg-gray-50 rounded-lg dark:bg-background">
        <div className="w-6 h-6 bg-gray-500 rounded"></div>
      </div>
    );
  }

  const IconComponent = iconMap[industry.iconName];
  const colors = getColorClasses(industry.color);

  if (!IconComponent) {
    return (
      <div className={`p-2 ${colors.bg} rounded-lg`}>
        <div
          className={`w-6 h-6 ${colors.text.replace("text-", "bg-")} rounded`}
        ></div>
      </div>
    );
  }

  return (
    <div className={`p-2 ${colors.bg} rounded-lg`}>
      <IconComponent className={`w-6 h-6 ${colors.text}`} />
    </div>
  );
};

export default function InvestorProfilePage() {
  const { id } = useParams();
  const [investor, setInvestor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchInvestorDetails(id as string);
    }
  }, [id]);

  const fetchInvestorDetails = async (investorId: string) => {
    try {
      setLoading(true);
      // We'll create this method in the service
      const data = await investorService.getInvestorProfile(investorId);
      setInvestor(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch investor details"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button asChild>
            <Link href="/">Go Back Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Investor Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The investor profile you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href="/">Go Back Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const investmentPreferences = investor.investmentPreferences;
  const profileInfo = investor.profileInfo;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6 dark:bg-background">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Image */}
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-primary/20">
                <AvatarImage
                  src={investor.avatarImage?.url || "/images/avatar.png"}
                  alt={investor.fullName}
                />
                <AvatarFallback className="text-2xl">
                  {investor.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              {investor.subscriptionPlan === "Investor Access Plan" && (
                <Badge className="absolute -top-2 -right-2 bg-primary text-black">
                  Premium Investor
                </Badge>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{investor.fullName}</h1>
                {investor.isEmailVerified && (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
                <span className="text-sm text-muted-foreground">
                  {investor.countryName || "Pakistan"}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Joined{" "}
                    {new Date(investor.createdAt || "").toLocaleDateString(
                      "en-US",
                      { month: "short", year: "numeric" }
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{investor.role}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{investor.countryName || "Pakistan"}</span>
                </div>
              </div>

              {/* Action Buttons */}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Investment Range */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Investment Range
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {investmentPreferences?.investmentRangeMin?.toLocaleString() ||
                    "1,000"}{" "}
                  - $
                  {investmentPreferences?.investmentRangeMax?.toLocaleString() ||
                    "5,000,000"}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Max {investmentPreferences?.maxInvestmentsPerYear || 1}{" "}
                  investments per year
                </p>
              </CardContent>
            </Card>

            {/* About Me */}
            <Card>
              <CardHeader>
                <CardTitle>About Me</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  {profileInfo?.aboutMe ||
                    investor.bio ||
                    "I am an Architect | Managed several high-profile projects in Dubai, ranging from luxury residential villas and commercial buildings to hospitality designs."}
                </p>
              </CardContent>
            </Card>

            {/* My Areas of Expertise */}
            <Card>
              <CardHeader>
                <CardTitle>My Areas of Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(
                    profileInfo?.areasOfExpertise || ["Design & Build Projects"]
                  ).map((expertise: string) => (
                    <Badge key={expertise} variant="secondary">
                      {expertise}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Companies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Companies
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profileInfo?.companies && profileInfo.companies.length > 0 ? (
                  <div className="space-y-4">
                    {profileInfo.companies.map((company, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        {company.logo?.url && (
                          <Image
                            src={company.logo.url}
                            alt={company.companyName || "Company"}
                            width={48}
                            height={48}
                            className="rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{company.companyName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {company.position}
                          </p>
                          {company.description && (
                            <p className="text-sm mt-1">
                              {company.description}
                            </p>
                          )}
                        </div>
                        {company.website && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={company.website} target="_blank">
                              <Globe className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No companies added yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Interests (Industries) */}
            <Card>
              <CardHeader>
                <CardTitle>Interests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Industries</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        investmentPreferences?.interestedIndustries || [
                          "Software",
                          "Media",
                          "Manufacturing & Engineering",
                          "Products & Inventions",
                          "Technology",
                          "Food & Beverage",
                        ]
                      ).map((industry) => (
                        <div
                          key={industry}
                          className="flex flex-col items-center text-center gap-2"
                        >
                          {renderIndustryIcon(industry)}
                          <span className="text-xs font-medium">
                            {industry}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Stages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(
                    investmentPreferences?.investmentStages || [
                      "Achieving Sales",
                      "Breaking Even",
                      "Profitable",
                      "Other",
                    ]
                  ).map((stage) => (
                    <Badge key={stage} variant="outline" className="text-xs">
                      {stage}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Keywords */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Keywords
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(
                    profileInfo?.areasOfExpertise || ["Design & Build Projects"]
                  ).map((expertise: string) => (
                    <Badge key={expertise} variant="secondary">
                      {expertise}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Countries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Countries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(investmentPreferences?.pitchCountries || ["Pakistan"]).map(
                    (country) => (
                      <Badge
                        key={country}
                        variant="outline"
                        className="text-xs"
                      >
                        {country}
                      </Badge>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
