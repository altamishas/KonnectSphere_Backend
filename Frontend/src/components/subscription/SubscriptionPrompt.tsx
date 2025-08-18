"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Target, Globe, ArrowRight, Crown } from "lucide-react";
import Link from "next/link";

interface SubscriptionPromptProps {
  type: "entrepreneur-publish" | "investor-global";
  userCountry?: string;
  className?: string;
}

export const SubscriptionPrompt = ({
  type,
  userCountry = "your region",
  className = "",
}: SubscriptionPromptProps) => {
  if (type === "entrepreneur-publish") {
    return (
      <Card
        className={`border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-white to-accent/5 dark:from-primary/10 dark:via-slate-800 dark:to-accent/10 ${className}`}
      >
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Ready to Launch Your Pitch?
            </CardTitle>
            <div className="p-2 bg-accent/10 rounded-lg">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
          </div>
          <CardDescription className="text-lg">
            Subscribe to a plan to publish your business pitch and connect with
            investors
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Basic Plan */}
            <div className="relative p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary/50 transition-colors">
              <Badge className="mb-3 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                Most Popular
              </Badge>
              <h3 className="font-semibold text-lg mb-2">Basic Plan</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Perfect for local market exposure
              </p>
              <ul className="text-sm space-y-1 mb-4">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Publish 1 pitch
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Local visibility
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Standard support
                </li>
              </ul>
              <div className="text-2xl font-bold text-primary mb-3">
                $49<span className="text-sm font-normal">/month</span>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="relative p-4 border-2 border-accent/50 rounded-lg bg-gradient-to-br from-accent/5 to-primary/5">
              <Badge className="mb-3 bg-gradient-to-r from-accent to-primary text-white">
                <Crown className="w-3 h-3 mr-1" />
                Recommended
              </Badge>
              <h3 className="font-semibold text-lg mb-2">Premium Plan</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Global reach with premium benefits
              </p>
              <ul className="text-sm space-y-1 mb-4">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                  Publish up to 5 pitches
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                  Global visibility
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                  Featured in search
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                  Priority support
                </li>
              </ul>
              <div className="text-2xl font-bold text-accent mb-3">
                $69<span className="text-sm font-normal">/month</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button asChild className="flex-1 bg-primary hover:bg-primary/90">
              <Link href="/pricing">
                <Target className="w-4 h-4 mr-2" />
                Choose Your Plan
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "investor-global") {
    return (
      <Card
        className={`border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-900/20 dark:via-slate-800 dark:to-indigo-900/20 dark:border-blue-700 ${className}`}
      >
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
              Unlock Global Investment Opportunities
            </CardTitle>
          </div>
          <CardDescription className="text-base">
            Currently viewing opportunities in {userCountry}. Upgrade to access
            worldwide pitches.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 text-blue-900 dark:text-blue-100">
              Investor Access Plan Benefits
            </h3>
            <ul className="text-sm space-y-2">
              <li className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Globe className="w-4 h-4" />
                Browse pitches from all countries
              </li>
              <li className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Target className="w-4 h-4" />
                Advanced search and filters
              </li>
              <li className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Sparkles className="w-4 h-4" />
                Access to detailed pitch documents
              </li>
              <li className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Crown className="w-4 h-4" />
                Priority customer support
              </li>
            </ul>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              $49<span className="text-lg font-normal">/year</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Get global access to high-potential investment opportunities
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              asChild
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link href="/pricing">
                <Globe className="w-4 h-4 mr-2" />
                Upgrade to Global Access
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default SubscriptionPrompt;
