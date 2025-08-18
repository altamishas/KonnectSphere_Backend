"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Industry } from "@/lib/types";

interface IndustryFilterProps {
  industries: Industry[];
  selectedIndustries: string[];
  onChange: (selected: string[]) => void;
}

const IndustryFilter = ({
  industries,
  selectedIndustries,
  onChange,
}: IndustryFilterProps) => {
  const [showAll, setShowAll] = useState(false);
  const displayLimit = 8;

  const displayedIndustries = showAll
    ? industries
    : industries.slice(0, displayLimit);

  const toggleIndustry = (industryId: string) => {
    const isSelected = selectedIndustries.includes(industryId);
    let newSelected;

    if (isSelected) {
      newSelected = selectedIndustries.filter((id) => id !== industryId);
    } else {
      newSelected = [...selectedIndustries, industryId];
    }

    onChange(newSelected);
  };

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  return (
    <div className="py-4">
      <div className="flex flex-wrap gap-2">
        {displayedIndustries.map((industry) => (
          <Badge
            key={industry.id}
            variant={
              selectedIndustries.includes(industry.id) ? "default" : "outline"
            }
            className={`cursor-pointer ${
              selectedIndustries.includes(industry.id)
                ? "bg-primary hover:bg-primary/80 text-white"
                : "hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
            onClick={() => toggleIndustry(industry.id)}
          >
            {industry.name}
            {industry.count !== undefined && (
              <span className="ml-1 text-xs opacity-70">
                ({industry.count})
              </span>
            )}
          </Badge>
        ))}

        {industries.length > displayLimit && (
          <button
            onClick={toggleShowAll}
            className="text-sm font-medium text-primary hover:underline"
          >
            {showAll ? "Show Less" : `Show All (${industries.length})`}
          </button>
        )}
      </div>
    </div>
  );
};

export default IndustryFilter;
