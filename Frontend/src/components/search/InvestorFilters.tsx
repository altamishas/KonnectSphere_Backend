"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  DollarSign,
  Building2,
  TrendingUp,
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  CONTINENTS,
  INDUSTRIES_LIST,
  INVESTMENT_STAGES,
} from "@/lib/constants";

// Filter state interface for investors
export interface InvestorFilterState {
  investmentRange: [number, number];
  countries: string[];
  industries: string[];
  stages: string[];
}

interface InvestorFiltersProps {
  initialFilters: InvestorFilterState;
  onApplyFilters: (filters: InvestorFilterState) => void;
  onResetFilters: () => void;
}

// Using constants from constants.ts to avoid duplication

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
};

const InvestorFilters = ({
  initialFilters,
  onApplyFilters,
  onResetFilters,
}: InvestorFiltersProps) => {
  const [filters, setFilters] = useState<InvestorFilterState>(initialFilters);
  const [expandedContinents, setExpandedContinents] = useState<
    Record<string, boolean>
  >({});

  // Investment range constants
  const MIN_INVESTMENT = 1000;
  const MAX_INVESTMENT = 10000000; // $10M

  const handleInvestmentRangeChange = (values: number[]) => {
    setFilters({
      ...filters,
      investmentRange: [values[0], values[1]] as [number, number],
    });
  };

  const handleCountryChange = (country: string, checked: boolean) => {
    const newCountries = checked
      ? [...filters.countries, country]
      : filters.countries.filter((c) => c !== country);

    setFilters({ ...filters, countries: newCountries });
  };

  const handleIndustryChange = (industry: string, checked: boolean) => {
    const newIndustries = checked
      ? [...filters.industries, industry]
      : filters.industries.filter((i) => i !== industry);

    setFilters({ ...filters, industries: newIndustries });
  };

  const handleStageChange = (stage: string, checked: boolean) => {
    const newStages = checked
      ? [...filters.stages, stage]
      : filters.stages.filter((s) => s !== stage);

    setFilters({ ...filters, stages: newStages });
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
  };

  const handleResetFilters = () => {
    const resetFilters: InvestorFilterState = {
      investmentRange: [MIN_INVESTMENT, MAX_INVESTMENT],
      countries: [],
      industries: [],
      stages: [],
    };
    setFilters(resetFilters);
    setExpandedContinents({});
    onResetFilters();
  };

  const toggleContinent = (continent: string) => {
    setExpandedContinents((prev) => ({
      ...prev,
      [continent]: !prev[continent],
    }));
  };

  // Calculate active filter count
  const getActiveFilterCount = () => {
    let count = 0;

    // Check investment range (only count if not default range)
    if (
      filters.investmentRange[0] !== MIN_INVESTMENT ||
      filters.investmentRange[1] !== MAX_INVESTMENT
    ) {
      count++;
    }

    // Count other filters
    if (filters.countries.length > 0) count++;
    if (filters.industries.length > 0) count++;
    if (filters.stages.length > 0) count++;

    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Get active filter summary
  const getActiveFilterSummary = () => {
    const summary = [];

    if (filters.countries.length > 0) {
      summary.push(
        `${filters.countries.length} countr${
          filters.countries.length === 1 ? "y" : "ies"
        }`
      );
    }
    if (filters.industries.length > 0) {
      summary.push(
        `${filters.industries.length} industr${
          filters.industries.length === 1 ? "y" : "ies"
        }`
      );
    }
    if (filters.stages.length > 0) {
      summary.push(
        `${filters.stages.length} stage${
          filters.stages.length === 1 ? "" : "s"
        }`
      );
    }
    if (
      filters.investmentRange[0] !== MIN_INVESTMENT ||
      filters.investmentRange[1] !== MAX_INVESTMENT
    ) {
      summary.push(
        `${formatCurrency(filters.investmentRange[0])} - ${formatCurrency(
          filters.investmentRange[1]
        )}`
      );
    }

    return summary;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full max-h-screen p-4">
      {/* Header - Fixed */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Investor Filters
            </h3>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>

        {/* Active filter summary */}
        {activeFilterCount > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {getActiveFilterSummary().map((summary, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {summary}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Filters - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-slate-100 dark:scrollbar-track-slate-800">
        <Accordion
          type="multiple"
          defaultValue={["investment", "countries", "industries", "stages"]}
        >
          {/* Investment Range Filter */}
          <AccordionItem value="investment" className="border-b-0">
            <AccordionTrigger className="py-3 text-slate-900 dark:text-white font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Investment Range
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-1 pb-4">
              <div className="mb-3 flex justify-between text-sm text-slate-600 dark:text-slate-300">
                <span>{formatCurrency(filters.investmentRange[0])}</span>
                <span>{formatCurrency(filters.investmentRange[1])}</span>
              </div>
              <Slider
                value={[filters.investmentRange[0], filters.investmentRange[1]]}
                min={MIN_INVESTMENT}
                max={MAX_INVESTMENT}
                step={10000}
                onValueChange={handleInvestmentRangeChange}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{formatCurrency(MIN_INVESTMENT)}</span>
                <span>{formatCurrency(MAX_INVESTMENT)}</span>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Countries Filter */}
          <AccordionItem value="countries" className="border-b-0">
            <AccordionTrigger className="py-3 text-slate-900 dark:text-white font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Countries
                {filters.countries.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {filters.countries.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2">
              {Object.entries(CONTINENTS).map(([continent, data]) => (
                <div
                  key={continent}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <button
                    type="button"
                    onClick={() => toggleContinent(continent)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
                      {continent}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                        {
                          data.countries.filter((country) =>
                            filters.countries.includes(country)
                          ).length
                        }
                        /{data.countries.length}
                      </span>
                      {expandedContinents[continent] ? (
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                  </button>

                  {expandedContinents[continent] && (
                    <div className="px-3 pb-3 grid grid-cols-1 gap-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-slate-100 dark:scrollbar-track-slate-800">
                      {data.countries.map((country) => (
                        <div
                          key={country}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`country-${country}`}
                            checked={filters.countries.includes(country)}
                            onCheckedChange={(checked) =>
                              handleCountryChange(country, checked as boolean)
                            }
                          />
                          <Label
                            htmlFor={`country-${country}`}
                            className="text-sm font-normal text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            {country}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* Industries Filter */}
          <AccordionItem value="industries" className="border-b-0">
            <AccordionTrigger className="py-3 text-slate-900 dark:text-white font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Industries
                {filters.industries.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {filters.industries.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-slate-100 dark:scrollbar-track-slate-800">
                {INDUSTRIES_LIST.map((industry) => (
                  <div key={industry} className="flex items-center space-x-2">
                    <Checkbox
                      id={`industry-${industry}`}
                      checked={filters.industries.includes(industry)}
                      onCheckedChange={(checked) =>
                        handleIndustryChange(industry, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`industry-${industry}`}
                      className="text-sm font-normal text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      {industry}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Investment Stages Filter */}
          <AccordionItem value="stages" className="border-b-0">
            <AccordionTrigger className="py-3 text-slate-900 dark:text-white font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Investment Stages
                {filters.stages.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {filters.stages.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-slate-100 dark:scrollbar-track-slate-800">
                {INVESTMENT_STAGES.map((stage) => (
                  <div key={stage} className="flex items-center space-x-2">
                    <Checkbox
                      id={`stage-${stage}`}
                      checked={filters.stages.includes(stage)}
                      onCheckedChange={(checked) =>
                        handleStageChange(stage, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`stage-${stage}`}
                      className="text-sm font-normal text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      {stage}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Footer - Fixed */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex-shrink-0">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            className="bg-primary hover:bg-primary/90 text-white w-full sm:flex-1"
            onClick={handleApplyFilters}
          >
            Apply Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-white text-primary">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleResetFilters}
            disabled={activeFilterCount === 0}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InvestorFilters;
