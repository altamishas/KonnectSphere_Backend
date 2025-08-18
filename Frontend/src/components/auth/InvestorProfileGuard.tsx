"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/hooks/hooks";

interface InvestorProfileGuardProps {
  children: React.ReactNode;
}

const InvestorProfileGuard = ({ children }: InvestorProfileGuardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Don't redirect if not authenticated or already on the completion page
    if (!isAuthenticated || pathname === "/complete-investor-profile") {
      return;
    }

    // Don't redirect if user data is not loaded yet
    if (!user) {
      return;
    }

    // Don't redirect if not an investor
    if (user.role !== "Investor") {
      return;
    }

    // Only redirect investors with incomplete profiles
    if (
      user.role === "Investor" &&
      user.isInvestorProfileComplete === false &&
      !user.professionalBackground
    ) {
      router.push("/complete-investor-profile");
    }
  }, [user, isAuthenticated, pathname, router]);

  // Render children normally - the useEffect will handle redirection
  return <>{children}</>;
};

export default InvestorProfileGuard;
