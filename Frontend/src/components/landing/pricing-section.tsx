"use client";

import { useAuthUser } from "@/hooks/auth/useAuthUser";
import PricingPlans from "@/components/shared/PricingPlans";

export default function Pricing() {
  const { user } = useAuthUser();
  const isInvestor = user?.role === "Investor";

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mx-auto max-w-[700px] text-slate-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-slate-400">
              Choose the perfect plan for your business needs. No hidden fees.
              Cancel anytime.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-7xl mt-16">
          <PricingPlans
            userType={isInvestor ? "investor" : "entrepreneur"}
            showRadioButtons={false}
          />
        </div>
      </div>
    </section>
  );
}
