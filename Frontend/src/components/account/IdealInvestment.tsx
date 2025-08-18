"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, X } from "lucide-react";
import { useProfile } from "@/hooks/updateProfile/useProfileUpdate";
import { COUNTRIES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Investment industries
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

// Major languages
const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Russian",
  "Chinese (Mandarin)",
  "Japanese",
  "Korean",
  "Arabic",
  "Hindi",
  "Bengali",
  "Urdu",
  "Indonesian",
  "Malay",
  "Thai",
  "Vietnamese",
  "Turkish",
  "Dutch",
  "Swedish",
  "Norwegian",
  "Danish",
  "Finnish",
  "Polish",
  "Czech",
  "Hungarian",
  "Romanian",
  "Bulgarian",
  "Croatian",
  "Serbian",
  "Slovak",
  "Lithuanian",
  "Latvian",
  "Estonian",
  "Greek",
  "Hebrew",
  "Persian",
  "Swahili",
  "Hausa",
  "Amharic",
  "Yoruba",
  "Igbo",
  "Zulu",
  "Afrikaans",
];

// Investment locations/regions
const INVESTMENT_LOCATIONS = [
  "North America",
  "South America",
  "Europe",
  "Asia",
  "Africa",
  "Oceania",
  "Middle East",
  "Caribbean",
  "Central America",
  "Eastern Europe",
  "Western Europe",
  "Southeast Asia",
  "East Asia",
  "South Asia",
  "Sub-Saharan Africa",
  "North Africa",
  "Pacific Islands",
];

const formSchema = z.object({
  investmentRangeMin: z
    .number()
    .min(1, "Minimum investment amount is required"),
  investmentRangeMax: z
    .number()
    .min(1, "Maximum investment amount is required"),
  maxInvestmentsPerYear: z
    .number()
    .min(1, "Number of investments per year is required"),
  interestedLocations: z
    .array(z.string())
    .min(1, "At least one location is required"),
  interestedIndustries: z
    .array(z.string())
    .min(1, "At least one industry is required"),
  pitchCountries: z
    .array(z.string())
    .min(1, "At least one country is required"),
  languages: z.array(z.string()).min(1, "At least one language is required"),
  additionalCriteria: z.string().optional(),
});

type IdealInvestmentFormData = z.infer<typeof formSchema>;

export default function IdealInvestmentTab() {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const {
    profile,
    isProfileLoading,
    updateProfile,
    isUpdating,
    refetchProfile,
  } = useProfile();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<IdealInvestmentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      investmentRangeMin: 1000,
      investmentRangeMax: 100000,
      maxInvestmentsPerYear: 1,
      interestedLocations: [],
      interestedIndustries: [],
      pitchCountries: [],
      languages: [],
      additionalCriteria: "",
    },
  });

  useEffect(() => {
    if (profile && !isProfileLoading) {
      const investmentPreferences = (profile.investmentPreferences || {}) as {
        investmentRangeMin?: number;
        investmentRangeMax?: number;
        maxInvestmentsPerYear?: number;
        interestedLocations?: string[];
        interestedIndustries?: string[];
        pitchCountries?: string[];
        languages?: string[];
        additionalCriteria?: string;
      };

      setSelectedLocations(investmentPreferences.interestedLocations || []);
      setSelectedIndustries(investmentPreferences.interestedIndustries || []);
      setSelectedCountries(investmentPreferences.pitchCountries || []);
      setSelectedLanguages(investmentPreferences.languages || []);

      reset({
        investmentRangeMin: investmentPreferences.investmentRangeMin || 1000,
        investmentRangeMax: investmentPreferences.investmentRangeMax || 100000,
        maxInvestmentsPerYear: investmentPreferences.maxInvestmentsPerYear || 1,
        interestedLocations: investmentPreferences.interestedLocations || [],
        interestedIndustries: investmentPreferences.interestedIndustries || [],
        pitchCountries: investmentPreferences.pitchCountries || [],
        languages: investmentPreferences.languages || [],
        additionalCriteria: investmentPreferences.additionalCriteria || "",
      });
    }
  }, [profile, isProfileLoading, reset]);

  const formData = watch();

  const onSubmit = (data: IdealInvestmentFormData) => {
    const formDataToSend = new FormData();

    // Create investment preferences object
    const investmentPreferences = {
      investmentRangeMin: data.investmentRangeMin,
      investmentRangeMax: data.investmentRangeMax,
      maxInvestmentsPerYear: data.maxInvestmentsPerYear,
      interestedLocations: selectedLocations,
      interestedIndustries: selectedIndustries,
      pitchCountries: selectedCountries,
      languages: selectedLanguages,
      additionalCriteria: data.additionalCriteria,
    };

    formDataToSend.append(
      "investmentPreferences",
      JSON.stringify(investmentPreferences)
    );

    updateProfile(formDataToSend);

    setTimeout(() => {
      refetchProfile();
    }, 1000);
  };

  const toggleSelection = (
    item: string,
    list: string[],
    setList: (items: string[]) => void,
    fieldName: keyof IdealInvestmentFormData
  ) => {
    const newList = list.includes(item)
      ? list.filter((i) => i !== item)
      : [...list, item];

    setList(newList);
    setValue(
      fieldName as
        | "interestedLocations"
        | "interestedIndustries"
        | "pitchCountries"
        | "languages",
      newList
    );
  };

  const removeItem = (
    item: string,
    list: string[],
    setList: (items: string[]) => void,
    fieldName: keyof IdealInvestmentFormData
  ) => {
    const newList = list.filter((i) => i !== item);
    setList(newList);
    setValue(
      fieldName as
        | "interestedLocations"
        | "interestedIndustries"
        | "pitchCountries"
        | "languages",
      newList
    );
  };

  if (isProfileLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">Ideal Investment Preferences</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Investment Range */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investment Range *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="investmentRangeMin">Minimum Amount ($)</Label>
                <Input
                  id="investmentRangeMin"
                  type="number"
                  {...register("investmentRangeMin", { valueAsNumber: true })}
                  placeholder="1,000"
                />
                {errors.investmentRangeMin && (
                  <p className="text-sm text-destructive">
                    {errors.investmentRangeMin.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="investmentRangeMax">Maximum Amount ($)</Label>
                <Input
                  id="investmentRangeMax"
                  type="number"
                  {...register("investmentRangeMax", { valueAsNumber: true })}
                  placeholder="100,000"
                />
                {errors.investmentRangeMax && (
                  <p className="text-sm text-destructive">
                    {errors.investmentRangeMax.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Number of Investments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investment Frequency *</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="maxInvestmentsPerYear">
                Maximum investments per year
              </Label>
              <Select
                onValueChange={(value) =>
                  setValue("maxInvestmentsPerYear", parseInt(value))
                }
                defaultValue={formData.maxInvestmentsPerYear?.toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} investment{num > 1 ? "s" : ""} per year
                    </SelectItem>
                  ))}
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>
              {errors.maxInvestmentsPerYear && (
                <p className="text-sm text-destructive">
                  {errors.maxInvestmentsPerYear.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Investment Locations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Preferred Investment Locations *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {INVESTMENT_LOCATIONS.map((location) => (
                <div key={location} className="flex items-center space-x-2">
                  <Checkbox
                    id={location}
                    checked={selectedLocations.includes(location)}
                    onCheckedChange={() =>
                      toggleSelection(
                        location,
                        selectedLocations,
                        setSelectedLocations,
                        "interestedLocations"
                      )
                    }
                  />
                  <Label htmlFor={location} className="text-sm">
                    {location}
                  </Label>
                </div>
              ))}
            </div>
            {selectedLocations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedLocations.map((location) => (
                  <Badge
                    key={location}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {location}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        removeItem(
                          location,
                          selectedLocations,
                          setSelectedLocations,
                          "interestedLocations"
                        )
                      }
                    />
                  </Badge>
                ))}
              </div>
            )}
            {errors.interestedLocations && (
              <p className="text-sm text-destructive">
                {errors.interestedLocations.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Industries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Interested Industries *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {INDUSTRIES.map((industry) => (
                <div key={industry} className="flex items-center space-x-2">
                  <Checkbox
                    id={industry}
                    checked={selectedIndustries.includes(industry)}
                    onCheckedChange={() =>
                      toggleSelection(
                        industry,
                        selectedIndustries,
                        setSelectedIndustries,
                        "interestedIndustries"
                      )
                    }
                  />
                  <Label htmlFor={industry} className="text-sm">
                    {industry}
                  </Label>
                </div>
              ))}
            </div>
            {selectedIndustries.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedIndustries.map((industry) => (
                  <Badge
                    key={industry}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {industry}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        removeItem(
                          industry,
                          selectedIndustries,
                          setSelectedIndustries,
                          "interestedIndustries"
                        )
                      }
                    />
                  </Badge>
                ))}
              </div>
            )}
            {errors.interestedIndustries && (
              <p className="text-sm text-destructive">
                {errors.interestedIndustries.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pitch Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Countries to Receive Pitches From *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {COUNTRIES.map((country) => (
                <div key={country} className="flex items-center space-x-2">
                  <Checkbox
                    id={country}
                    checked={selectedCountries.includes(country)}
                    onCheckedChange={() =>
                      toggleSelection(
                        country,
                        selectedCountries,
                        setSelectedCountries,
                        "pitchCountries"
                      )
                    }
                  />
                  <Label htmlFor={country} className="text-sm">
                    {country}
                  </Label>
                </div>
              ))}
            </div>
            {selectedCountries.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedCountries.map((country) => (
                  <Badge
                    key={country}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {country}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        removeItem(
                          country,
                          selectedCountries,
                          setSelectedCountries,
                          "pitchCountries"
                        )
                      }
                    />
                  </Badge>
                ))}
              </div>
            )}
            {errors.pitchCountries && (
              <p className="text-sm text-destructive">
                {errors.pitchCountries.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Languages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preferred Languages *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {LANGUAGES.map((language) => (
                <div key={language} className="flex items-center space-x-2">
                  <Checkbox
                    id={language}
                    checked={selectedLanguages.includes(language)}
                    onCheckedChange={() =>
                      toggleSelection(
                        language,
                        selectedLanguages,
                        setSelectedLanguages,
                        "languages"
                      )
                    }
                  />
                  <Label htmlFor={language} className="text-sm">
                    {language}
                  </Label>
                </div>
              ))}
            </div>
            {selectedLanguages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedLanguages.map((language) => (
                  <Badge
                    key={language}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {language}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        removeItem(
                          language,
                          selectedLanguages,
                          setSelectedLanguages,
                          "languages"
                        )
                      }
                    />
                  </Badge>
                ))}
              </div>
            )}
            {errors.languages && (
              <p className="text-sm text-destructive">
                {errors.languages.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Additional Criteria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Additional Investment Criteria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="additionalCriteria">
                Describe any additional criteria or preferences
              </Label>
              <Textarea
                id="additionalCriteria"
                {...register("additionalCriteria")}
                placeholder="e.g., Only interested in companies with proven revenue, looking for sustainable/green businesses, prefer B2B companies, etc."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isUpdating} className="min-w-[120px]">
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Preferences"
            )}
          </Button>
        </div>
      </form>
    </>
  );
}
