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
  CreditCard,
  Filter,
  RotateCcw,
} from "lucide-react";

// Filter state interface
export interface PitchFilterState {
  investmentRange: [number, number];
  countries: string[];
  industries: string[];
  stages: string[];
  fundingTypes: string[];
}

interface PitchFiltersProps {
  initialFilters: PitchFilterState;
  onApplyFilters: (filters: PitchFilterState) => void;
  onResetFilters: () => void;
}

// Define the continent data structure
interface ContinentData {
  countries: readonly string[];
}

// Complete list of continents and their countries (alphabetically sorted)
const CONTINENTS: Record<string, ContinentData> = {
  "North America": {
    countries: [
      "Antigua and Barbuda",
      "Bahamas",
      "Barbados",
      "Belize",
      "Canada",
      "Costa Rica",
      "Cuba",
      "Dominica",
      "Dominican Republic",
      "El Salvador",
      "Grenada",
      "Guatemala",
      "Haiti",
      "Honduras",
      "Jamaica",
      "Mexico",
      "Nicaragua",
      "Panama",
      "Saint Kitts and Nevis",
      "Saint Lucia",
      "Saint Vincent and the Grenadines",
      "Trinidad and Tobago",
      "United States",
    ],
  },
  "South America": {
    countries: [
      "Argentina",
      "Bolivia",
      "Brazil",
      "Chile",
      "Colombia",
      "Ecuador",
      "French Guiana",
      "Guyana",
      "Paraguay",
      "Peru",
      "Suriname",
      "Uruguay",
      "Venezuela",
    ],
  },
  Europe: {
    countries: [
      "Albania",
      "Andorra",
      "Austria",
      "Belgium",
      "Bosnia and Herzegovina",
      "Bulgaria",
      "Croatia",
      "Czech Republic",
      "Denmark",
      "Estonia",
      "Finland",
      "France",
      "Germany",
      "Greece",
      "Hungary",
      "Iceland",
      "Ireland",
      "Italy",
      "Latvia",
      "Liechtenstein",
      "Lithuania",
      "Luxembourg",
      "Malta",
      "Moldova",
      "Monaco",
      "Montenegro",
      "Netherlands",
      "North Macedonia",
      "Norway",
      "Poland",
      "Portugal",
      "Romania",
      "San Marino",
      "Slovakia",
      "Slovenia",
      "Spain",
      "Sweden",
      "Switzerland",
      "Ukraine",
      "United Kingdom",
      "Vatican City",
    ],
  },
  Asia: {
    countries: [
      "Afghanistan",
      "Armenia",
      "Azerbaijan",
      "Bahrain",
      "Bangladesh",
      "Bhutan",
      "Brunei",
      "Cambodia",
      "China",
      "Cyprus",
      "Georgia",
      "India",
      "Indonesia",
      "Iran",
      "Iraq",
      "Israel",
      "Japan",
      "Jordan",
      "Kazakhstan",
      "Kuwait",
      "Kyrgyzstan",
      "Laos",
      "Lebanon",
      "Malaysia",
      "Maldives",
      "Mongolia",
      "Myanmar",
      "Nepal",
      "North Korea",
      "Oman",
      "Pakistan",
      "Philippines",
      "Qatar",
      "Saudi Arabia",
      "Singapore",
      "South Korea",
      "Sri Lanka",
      "State of Palestine",
      "Syria",
      "Tajikistan",
      "Thailand",
      "Timor-Leste",
      "Turkey",
      "Turkmenistan",
      "United Arab Emirates",
      "Uzbekistan",
      "Vietnam",
      "Yemen",
    ],
  },
  Africa: {
    countries: [
      "Algeria",
      "Angola",
      "Benin",
      "Botswana",
      "Burkina Faso",
      "Burundi",
      "Cabo Verde",
      "Cameroon",
      "Central African Republic",
      "Chad",
      "Comoros",
      "Congo",
      "Democratic Republic of the Congo",
      "Djibouti",
      "Egypt",
      "Equatorial Guinea",
      "Eritrea",
      "Eswatini",
      "Ethiopia",
      "Gabon",
      "Gambia",
      "Ghana",
      "Guinea",
      "Guinea-Bissau",
      "Ivory Coast",
      "Kenya",
      "Lesotho",
      "Liberia",
      "Libya",
      "Madagascar",
      "Malawi",
      "Mali",
      "Mauritania",
      "Mauritius",
      "Morocco",
      "Mozambique",
      "Namibia",
      "Niger",
      "Nigeria",
      "Rwanda",
      "São Tomé and Príncipe",
      "Senegal",
      "Seychelles",
      "Sierra Leone",
      "Somalia",
      "South Africa",
      "South Sudan",
      "Sudan",
      "Tanzania",
      "Togo",
      "Tunisia",
      "Uganda",
      "Zambia",
      "Zimbabwe",
    ],
  },
  Oceania: {
    countries: [
      "Australia",
      "Fiji",
      "French Polynesia",
      "New Caledonia",
      "New Zealand",
      "Papua New Guinea",
      "Samoa",
      "Solomon Islands",
      "Tonga",
      "Vanuatu",
    ],
  },
  Antarctica: {
    countries: [
      "No independent countries - Territory governed by Antarctic Treaty",
    ],
  },
} as const;

// Business stages
const BUSINESS_STAGES = [
  { id: "achieving-sales", name: "Achieving Sales" },
  { id: "breaking-even", name: "Breaking Even" },
  { id: "mvp-finished", name: "MVP/Finished Product" },
  { id: "prestartup-rd", name: "PreStartup/R&D" },
  { id: "profitable", name: "Profitable" },
  { id: "other", name: "Other" },
];

// Funding types
const FUNDING_TYPES = [
  { id: "equity", name: "Equity" },
  { id: "loan", name: "Loan" },
];

// Industries from constants (simplified for component)
const INDUSTRIES = [
  "Agriculture",
  "Business Services",
  "Education & Training",
  "Energy & Natural Resources",
  "Entertainment & Leisure",
  "Fashion & Beauty",
  "Finance",
  "Food & Beverage",
  "Hospitality, Restaurants & Bars",
  "Manufacturing & Engineering",
  "Media",
  "Medical & Pharmaceutical",
  "Personal Services",
  "Products & Inventions",
  "Property & Land",
  "Retail",
  "Sales & Marketing",
  "Software & Web Development",
  "Technology",
  "Transport",
];

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
};

const PitchFilters = ({
  initialFilters,
  onApplyFilters,
  onResetFilters,
}: PitchFiltersProps) => {
  const [filters, setFilters] = useState<PitchFilterState>(initialFilters);
  const [selectedContinent, setSelectedContinent] = useState<string | null>(
    null
  );
  const [showAllIndustries, setShowAllIndustries] = useState(false);

  const investmentRangeMin = 1000;
  const investmentRangeMax = 10000000;

  const handleInvestmentRangeChange = (values: number[]) => {
    setFilters({
      ...filters,
      investmentRange: [values[0], values[1]] as [number, number],
    });
  };

  const handleContinentSelect = (continent: keyof typeof CONTINENTS) => {
    if (selectedContinent === continent) {
      setSelectedContinent(null);
    } else {
      setSelectedContinent(continent);
    }
  };

  const handleCountryChange = (country: string) => {
    const newCountries = filters.countries.includes(country)
      ? filters.countries.filter((c) => c !== country)
      : [...filters.countries, country];

    setFilters({ ...filters, countries: newCountries });
  };

  const handleIndustryToggle = (industry: string) => {
    const newIndustries = filters.industries.includes(industry)
      ? filters.industries.filter((i) => i !== industry)
      : [...filters.industries, industry];

    setFilters({ ...filters, industries: newIndustries });
  };

  const handleStageChange = (stageId: string) => {
    const newStages = filters.stages.includes(stageId)
      ? filters.stages.filter((id) => id !== stageId)
      : [...filters.stages, stageId];

    setFilters({ ...filters, stages: newStages });
  };

  const handleFundingTypeChange = (typeId: string) => {
    const newFundingTypes = filters.fundingTypes.includes(typeId)
      ? filters.fundingTypes.filter((id) => id !== typeId)
      : [...filters.fundingTypes, typeId];

    setFilters({ ...filters, fundingTypes: newFundingTypes });
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
  };

  const handleResetFilters = () => {
    const resetFilters: PitchFilterState = {
      investmentRange: [investmentRangeMin, investmentRangeMax],
      countries: [],
      industries: [],
      stages: [],
      fundingTypes: [],
    };
    setFilters(resetFilters);
    // Reset local UI state
    setSelectedContinent(null);
    setShowAllIndustries(false);
    onResetFilters();
  };

  // Calculate total active filters
  const getTotalActiveFilters = () => {
    return (
      filters.countries.length +
      filters.industries.length +
      filters.stages.length +
      filters.fundingTypes.length +
      (filters.investmentRange[0] !== investmentRangeMin ||
      filters.investmentRange[1] !== investmentRangeMax
        ? 1
        : 0)
    );
  };

  const displayedIndustries = showAllIndustries
    ? INDUSTRIES
    : INDUSTRIES.slice(0, 8);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
            <Filter className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Advanced Filters
              </h3>
              {getTotalActiveFilters() > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {getTotalActiveFilters()} active
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Find your perfect investment match
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Accordion
          type="multiple"
          defaultValue={[
            "investment",
            "countries",
            "industries",
            "stages",
            "funding",
          ]}
          className="space-y-2"
        >
          {/* Investment Range */}
          <AccordionItem
            value="investment"
            className="border border-slate-200 dark:border-slate-700 rounded-lg px-4"
          >
            <AccordionTrigger className="py-4 text-slate-900 dark:text-white font-semibold hover:no-underline">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-primary" />
                Investment Range
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2 pb-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    {formatCurrency(filters.investmentRange[0])}
                  </span>
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    {formatCurrency(filters.investmentRange[1])}
                  </span>
                </div>
                <div className="px-2">
                  <Slider
                    value={[
                      filters.investmentRange[0],
                      filters.investmentRange[1],
                    ]}
                    min={investmentRangeMin}
                    max={investmentRangeMax}
                    step={1000}
                    onValueChange={handleInvestmentRangeChange}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{formatCurrency(investmentRangeMin)}</span>
                  <span>{formatCurrency(investmentRangeMax)}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Modified Countries by Continent */}
          <AccordionItem
            value="countries"
            className="border border-slate-200 dark:border-slate-700 rounded-lg px-4"
          >
            <AccordionTrigger className="py-4 text-slate-900 dark:text-white font-semibold hover:no-underline">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-primary" />
                Countries
                {filters.countries.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {filters.countries.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-4">
                {/* Continents Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                  {(
                    Object.keys(CONTINENTS) as Array<keyof typeof CONTINENTS>
                  ).map((continent) => (
                    <button
                      key={continent}
                      onClick={() => handleContinentSelect(continent)}
                      className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                        selectedContinent === continent
                          ? "border-primary bg-primary/5 text-primary font-semibold"
                          : "border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      <span className="text-sm font-medium text-center">
                        {continent}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Countries List */}
                {selectedContinent && (
                  <div className="space-y-2 animate-slide-in-bottom">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {selectedContinent} Countries
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedContinent(null)}
                        className="text-xs"
                      >
                        Back to Continents
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
                      {CONTINENTS[selectedContinent].countries.map(
                        (country) => (
                          <div
                            key={country}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`country-${country}`}
                              checked={filters.countries.includes(country)}
                              onCheckedChange={() =>
                                handleCountryChange(country)
                              }
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <Label
                              htmlFor={`country-${country}`}
                              className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:text-primary transition-colors"
                            >
                              {country}
                            </Label>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Modified Industries section */}
          <AccordionItem
            value="industries"
            className="border border-slate-200 dark:border-slate-700 rounded-lg px-4"
          >
            <AccordionTrigger className="py-4 text-slate-900 dark:text-white font-semibold hover:no-underline">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                Industries
                {filters.industries.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {filters.industries.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {displayedIndustries.map((industry) => (
                    <Badge
                      key={industry}
                      variant={
                        filters.industries.includes(industry)
                          ? "default"
                          : "outline"
                      }
                      className={`cursor-pointer transition-all duration-200 ${
                        filters.industries.includes(industry)
                          ? "bg-primary hover:bg-primary/80 text-primary-foreground shadow-md"
                          : "hover:bg-primary/10 hover:border-primary/50 hover:text-primary"
                      }`}
                      onClick={() => handleIndustryToggle(industry)}
                    >
                      {industry}
                    </Badge>
                  ))}
                </div>
                {INDUSTRIES.length > 8 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllIndustries(!showAllIndustries)}
                    className="text-primary hover:text-primary/80 hover:bg-primary/5"
                  >
                    {showAllIndustries
                      ? "Show Less"
                      : `Show All (${INDUSTRIES.length})`}
                  </Button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Business Stages */}
          <AccordionItem
            value="stages"
            className="border border-slate-200 dark:border-slate-700 rounded-lg px-4"
          >
            <AccordionTrigger className="py-4 text-slate-900 dark:text-white font-semibold hover:no-underline">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                Business Stages
                {filters.stages.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {filters.stages.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="grid grid-cols-1 gap-3">
                {BUSINESS_STAGES.map((stage) => (
                  <div key={stage.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`stage-${stage.id}`}
                      checked={filters.stages.includes(stage.id)}
                      onCheckedChange={() => handleStageChange(stage.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label
                      htmlFor={`stage-${stage.id}`}
                      className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:text-primary transition-colors font-medium"
                    >
                      {stage.name}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Funding Types */}
          <AccordionItem
            value="funding"
            className="border border-slate-200 dark:border-slate-700 rounded-lg px-4"
          >
            <AccordionTrigger className="py-4 text-slate-900 dark:text-white font-semibold hover:no-underline">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                Funding Types
                {filters.fundingTypes.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {filters.fundingTypes.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="grid grid-cols-2 gap-3">
                {FUNDING_TYPES.map((type) => (
                  <div key={type.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`funding-${type.id}`}
                      checked={filters.fundingTypes.includes(type.id)}
                      onCheckedChange={() => handleFundingTypeChange(type.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label
                      htmlFor={`funding-${type.id}`}
                      className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:text-primary transition-colors font-medium"
                    >
                      {type.name}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Action Buttons */}
      <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50/50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-700/50">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleApplyFilters}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex-1"
          >
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
          <Button
            variant="outline"
            onClick={handleResetFilters}
            className="border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PitchFilters;
