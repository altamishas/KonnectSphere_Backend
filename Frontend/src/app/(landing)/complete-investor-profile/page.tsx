"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/hooks/hooks";
import InvestorProfileForm from "@/components/investor/InvestorProfileForm";
import {
  useInvestorProfile,
  type InvestorProfileData,
} from "@/hooks/investor/useInvestorProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, UserCheck } from "lucide-react";

const CompleteInvestorProfilePage = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { completeInvestorProfile, isLoading } = useInvestorProfile();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Redirect if not an investor
    if (user?.role !== "Investor") {
      router.push("/");
      return;
    }

    // Redirect if profile is already complete
    if (user?.isInvestorProfileComplete) {
      router.push("/");
      return;
    }
  }, [isAuthenticated, user, router]);

  const handleProfileSubmit = (data: InvestorProfileData) => {
    completeInvestorProfile({
      // Basic fields
      countryName: data.countryName,

      // Profile info fields
      aboutMe: data.aboutMe,
      areasOfExpertise: data.areasOfExpertise,
      previousInvestments: data.previousInvestments,

      // Investment preferences fields
      investmentRangeMin: data.investmentRangeMin,
      investmentRangeMax: data.investmentRangeMax,
      maxInvestmentsPerYear: data.maxInvestmentsPerYear,
      interestedIndustries: data.interestedIndustries,
      pitchCountries: data.pitchCountries,
      investmentStages: data.investmentStages,
    });
  };

  // Show loading state while checking authentication
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render if user is not an investor or profile is complete
  if (user.role !== "Investor" || user.isInvestorProfileComplete) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="container mx-auto px-4">
        {/* Progress Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <UserCheck className="h-6 w-6 text-primary" />
                Complete Your Investor Profile
              </CardTitle>
              <p className="text-muted-foreground">
                Welcome to KonnectSphere! Complete your investor profile to help
                entrepreneurs find and connect with you.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Account Created</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary animate-pulse" />
                  <span className="text-sm font-medium">Complete Profile</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Start Connecting
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Form */}
        <InvestorProfileForm
          onSubmit={handleProfileSubmit}
          isLoading={isLoading}
        />

        {/* Help Text */}
        <div className="max-w-4xl mx-auto mt-8">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Why complete your profile?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  • Help entrepreneurs find investors that match their needs
                </li>
                <li>• Showcase your expertise and investment preferences</li>
                <li>• Receive relevant pitch opportunities</li>
                <li>
                  • Build credibility with detailed professional background
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompleteInvestorProfilePage;
