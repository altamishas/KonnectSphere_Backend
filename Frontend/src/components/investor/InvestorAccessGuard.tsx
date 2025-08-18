"use client";

import React from "react";
import { useInvestorAccess } from "@/hooks/subscription/useSubscription";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin, Crown, Users, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

interface InvestorAccessGuardProps {
  children: React.ReactNode;
  showAccessInfo?: boolean;
}

export function InvestorAccessGuard({
  children,
  showAccessInfo = true,
}: InvestorAccessGuardProps) {
  const { isLoading } = useInvestorAccess();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded"></div>;
  }

  return (
    <div className="space-y-4">
      {showAccessInfo && <InvestorAccessIndicator />}
      {children}
    </div>
  );
}

export function InvestorAccessIndicator() {
  const {
    canAccessGlobalInvestors,
    userCountry,
    getInvestorAccessMessage,
    isLoading,
  } = useInvestorAccess();
  const router = useRouter();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-16 rounded"></div>;
  }

  if (canAccessGlobalInvestors) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <Globe className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-green-600" />
            <span className="font-medium">Global Investor Access</span>
            <Badge className="bg-green-100 text-green-800">Premium</Badge>
          </div>
          <span className="text-sm text-green-700">
            Access to investors worldwide
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <MapPin className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <p className="font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Regional Access Only
            {userCountry && (
              <Badge variant="outline" className="text-xs">
                {userCountry}
              </Badge>
            )}
          </p>
          <p className="text-sm text-orange-700 mt-1">
            {getInvestorAccessMessage()}
          </p>
        </div>
        <Button size="sm" onClick={() => router.push("/pricing")}>
          <Crown className="h-4 w-4 mr-1" />
          Upgrade
        </Button>
      </AlertDescription>
    </Alert>
  );
}

interface FilteredInvestorListProps {
  investors: Array<{ name?: string; [key: string]: unknown }>;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function FilteredInvestorList({
  investors,
  isLoading = false,
  emptyMessage = "No investors found in your region.",
}: FilteredInvestorListProps) {
  const { canAccessGlobalInvestors, userCountry } = useInvestorAccess();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-32 rounded"></div>
        ))}
      </div>
    );
  }

  if (investors.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Investors Found</h3>
          <p className="text-gray-600 mb-4">{emptyMessage}</p>
          {!canAccessGlobalInvestors && (
            <div className="space-y-2">
              <p className="text-sm text-orange-600">
                Currently showing investors from {userCountry || "your region"}{" "}
                only.
              </p>
              <Button onClick={() => router.push("/pricing")} size="sm">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to See Global Investors
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {!canAccessGlobalInvestors && (
        <Alert className="border-blue-200 bg-blue-50">
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            Showing {investors.length} investors from{" "}
            {userCountry || "your region"}.
            <Button
              size="sm"
              variant="link"
              onClick={() => router.push("/pricing")}
              className="ml-2 p-0 h-auto"
            >
              Upgrade to see global investors →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Render investor list here */}
      {investors.map((investor, index) => (
        <div key={index} className="p-4 border rounded-lg">
          {/* Your existing investor card component */}
          <p>Investor: {investor.name || `Investor ${index + 1}`}</p>
        </div>
      ))}
    </div>
  );
}

export function InvestorSearchHeader() {
  const { canAccessGlobalInvestors, userCountry } = useInvestorAccess();
  const router = useRouter();

  return (
    <div className="mb-6">
      {!canAccessGlobalInvestors && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">
              You&apos;re currently viewing investors from{" "}
              {userCountry || "your region"} only.
            </span>
            <Button size="sm" onClick={() => router.push("/pricing")}>
              See Global Investors
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
