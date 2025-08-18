"use client";

import { InvestorSearchComponent } from "@/components/search/InvestorSearchComponent";
import { InvestorSearchHeader } from "@/components/investor/InvestorAccessGuard";

const InvestorSearchPage = () => {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
      <InvestorSearchHeader />
      <InvestorSearchComponent fullWidth={false} />
    </div>
  );
};

export default InvestorSearchPage;
