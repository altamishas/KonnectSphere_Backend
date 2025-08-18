"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MyInvestorsComponent } from "@/components/entrepreneur/MyInvestorsComponent";
import { useAuthUser } from "@/hooks/auth/useAuthUser";

const MyInvestorsPage = () => {
  const { user, isAuthenticated } = useAuthUser();
  const router = useRouter();

  useEffect(() => {
    // Redirect non-entrepreneurs to appropriate pages
    if (isAuthenticated && user?.role !== "Entrepreneur") {
      router.push("/explore-pitches");
    }
  }, [user, isAuthenticated, router]);

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  if (user?.role !== "Entrepreneur") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            This page is only available for entrepreneurs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
              My Investors
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MyInvestorsComponent />
      </div>
    </div>
  );
};

export default MyInvestorsPage;
