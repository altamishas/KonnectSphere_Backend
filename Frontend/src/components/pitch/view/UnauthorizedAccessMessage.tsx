"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Building2, TrendingUp } from "lucide-react";
import Link from "next/link";

export const UnauthorizedAccessMessage = () => {
  return (
    <div className="py-12 bg-slate-50 dark:bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <UserPlus className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Sign Up to View Full Pitch Details
            </h3>

            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join KonnectSphere to access complete pitch information, connect
              with entrepreneurs, and discover investment opportunities.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <Button
                asChild
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Link
                  href="/register?role=Investor"
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Sign up as Investor
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                <Link
                  href="/register?role=Entrepreneur"
                  className="flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Sign up as Entrepreneur
                </Link>
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
