"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Plus,
  DollarSign,
  Building2,
  Target,
  Users,
  Search,
  Globe,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { COUNTRIES, INDUSTRIES_LIST, INVESTMENT_STAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Using constants from constants.ts to avoid duplication

// Updated validation schema to include all mandatory fields
const investorProfileSchema = z
  .object({
    // Basic fields
    countryName: z.string().min(1, "Country is required"),
    aboutMe: z
      .string()
      .min(10, "About me must be at least 10 characters")
      .max(2000, "About me cannot exceed 2000 characters"),
    areasOfExpertise: z
      .string()
      .min(1, "Please enter at least one area of expertise"),
    investmentStages: z
      .array(z.string())
      .min(1, "Please select at least one investment stage"),
    interestedIndustries: z
      .array(z.string())
      .min(1, "Please select at least one industry"),
    pitchCountries: z
      .array(z.string())
      .min(1, "Please select at least one country to receive pitches from"),
    previousInvestments: z
      .number()
      .min(0, "Previous investments cannot be negative"),

    // Investment Preferences fields
    investmentRangeMin: z
      .number()
      .min(1000, "Minimum investment must be at least $1,000"),
    investmentRangeMax: z
      .number()
      .min(1000, "Maximum investment must be at least $1,000"),
    maxInvestmentsPerYear: z
      .number()
      .min(1, "Must invest in at least 1 company per year")
      .max(50, "Maximum 50 investments per year"),
  })
  .refine((data) => data.investmentRangeMax > data.investmentRangeMin, {
    message: "Maximum investment must be greater than minimum investment",
    path: ["investmentRangeMax"],
  });

type InvestorProfileFormData = z.infer<typeof investorProfileSchema>;

interface InvestorProfileFormProps {
  initialData?: Partial<InvestorProfileFormData>;
  onSubmit: (data: InvestorProfileFormData) => void;
  isLoading?: boolean;
}

const InvestorProfileForm = ({
  initialData,
  onSubmit,
  isLoading = false,
}: InvestorProfileFormProps) => {
  const [expertiseInput, setExpertiseInput] = useState("");
  const [expertiseList, setExpertiseList] = useState<string[]>(
    initialData?.areasOfExpertise
      ? (initialData.areasOfExpertise as string)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : []
  );
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(
    Array.isArray(initialData?.interestedIndustries)
      ? initialData?.interestedIndustries || []
      : typeof initialData?.interestedIndustries === "string" &&
        initialData?.interestedIndustries
      ? (initialData.interestedIndustries as string)
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : []
  );
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedPitchCountries, setSelectedPitchCountries] = useState<
    string[]
  >(
    Array.isArray(initialData?.pitchCountries)
      ? initialData?.pitchCountries || []
      : []
  );
  const [countryOpen, setCountryOpen] = useState(false);

  const form = useForm<InvestorProfileFormData>({
    resolver: zodResolver(investorProfileSchema),
    defaultValues: {
      countryName: initialData?.countryName || "",
      aboutMe: initialData?.aboutMe || "",
      areasOfExpertise: initialData?.areasOfExpertise || "",
      investmentStages: initialData?.investmentStages || [],
      interestedIndustries: Array.isArray(initialData?.interestedIndustries)
        ? initialData?.interestedIndustries || []
        : typeof initialData?.interestedIndustries === "string" &&
          initialData?.interestedIndustries
        ? (initialData.interestedIndustries as string)
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [],
      pitchCountries: Array.isArray(initialData?.pitchCountries)
        ? initialData?.pitchCountries || []
        : [],
      investmentRangeMin: initialData?.investmentRangeMin || 25000,
      investmentRangeMax: initialData?.investmentRangeMax || 500000,
      previousInvestments: initialData?.previousInvestments || 0,
      maxInvestmentsPerYear: initialData?.maxInvestmentsPerYear || 5,
    },
  });

  const addExpertise = () => {
    if (
      expertiseInput.trim() &&
      !expertiseList.includes(expertiseInput.trim())
    ) {
      const newList = [...expertiseList, expertiseInput.trim()];
      setExpertiseList(newList);
      form.setValue("areasOfExpertise", newList.join(", "));
      setExpertiseInput("");
    }
  };

  const removeExpertise = (expertiseToRemove: string) => {
    const newList = expertiseList.filter(
      (expertise) => expertise !== expertiseToRemove
    );
    setExpertiseList(newList);
    form.setValue("areasOfExpertise", newList.join(", "));
  };

  const toggleIndustry = (industry: string) => {
    const newList = selectedIndustries.includes(industry)
      ? selectedIndustries.filter((i) => i !== industry)
      : [...selectedIndustries, industry];

    setSelectedIndustries(newList);
    form.setValue("interestedIndustries", newList);
  };

  const removeIndustry = (industryToRemove: string) => {
    const newList = selectedIndustries.filter(
      (industry) => industry !== industryToRemove
    );
    setSelectedIndustries(newList);
    form.setValue("interestedIndustries", newList);
  };

  const toggleStage = (stage: string) => {
    const newList = selectedStages.includes(stage)
      ? selectedStages.filter((s) => s !== stage)
      : [...selectedStages, stage];

    setSelectedStages(newList);
    form.setValue("investmentStages", newList);
  };

  const removeStage = (stageToRemove: string) => {
    const newList = selectedStages.filter((stage) => stage !== stageToRemove);
    setSelectedStages(newList);
    form.setValue("investmentStages", newList);
  };

  const togglePitchCountry = (country: string) => {
    const newList = selectedPitchCountries.includes(country)
      ? selectedPitchCountries.filter((c) => c !== country)
      : [...selectedPitchCountries, country];

    setSelectedPitchCountries(newList);
    form.setValue("pitchCountries", newList);
  };

  const removePitchCountry = (countryToRemove: string) => {
    const newList = selectedPitchCountries.filter(
      (country) => country !== countryToRemove
    );
    setSelectedPitchCountries(newList);
    form.setValue("pitchCountries", newList);
  };

  const handleSubmit = (data: InvestorProfileFormData) => {
    if (expertiseList.length === 0) {
      toast.error("Please add at least one area of expertise");
      return;
    }

    if (selectedIndustries.length === 0) {
      toast.error("Please select at least one industry");
      return;
    }

    if (selectedStages.length === 0) {
      toast.error("Please select at least one investment stage");
      return;
    }

    if (selectedPitchCountries.length === 0) {
      toast.error("Please select at least one country to receive pitches from");
      return;
    }

    onSubmit({
      ...data,
      areasOfExpertise: expertiseList.join(", "),
      interestedIndustries: selectedIndustries,
      investmentStages: selectedStages,
      pitchCountries: selectedPitchCountries,
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Complete Your Investor Profile
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          These details help entrepreneurs find and connect with you. Complete
          all mandatory fields to activate your profile.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Country Selection */}
            <FormField
              control={form.control}
              name="countryName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Country *
                  </FormLabel>
                  <FormControl>
                    <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={countryOpen}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value || "Select country..."}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search country..." />
                          <CommandEmpty>No country found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-y-auto">
                            {COUNTRIES.map((country) => (
                              <CommandItem
                                key={country}
                                onSelect={() => {
                                  field.onChange(country);
                                  setCountryOpen(false);
                                }}
                              >
                                {country}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormDescription>
                    Select your country of residence for investor matching.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* About Me (replaces Professional Background) */}
            <FormField
              control={form.control}
              name="aboutMe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    About Me *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself, your professional background, investment philosophy, and what makes you a valuable investor..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe your professional background, experience, and
                    investment approach. This will be displayed on your investor
                    profile.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Areas of Expertise */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Areas of Expertise *
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., SaaS, AI, Healthcare, Fintech"
                  value={expertiseInput}
                  onChange={(e) => setExpertiseInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addExpertise())
                  }
                />
                <Button
                  type="button"
                  onClick={addExpertise}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {expertiseList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {expertiseList.map((expertise) => (
                    <Badge
                      key={expertise}
                      variant="secondary"
                      className="px-3 py-1"
                    >
                      {expertise}
                      <button
                        type="button"
                        onClick={() => removeExpertise(expertise)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Add the areas where you have expertise and like to invest.
              </p>
            </div>

            {/* Investment Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="investmentRangeMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Investment Amount *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="25000"
                          className="pl-9"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="investmentRangeMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Investment Amount *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="500000"
                          className="pl-9"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Investment Stages */}
            <FormField
              control={form.control}
              name="investmentStages"
              render={() => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Investment Stages *
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {INVESTMENT_STAGES.map((stage) => (
                          <div
                            key={stage}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={stage}
                              checked={selectedStages.includes(stage)}
                              onCheckedChange={() => toggleStage(stage)}
                            />
                            <Label htmlFor={stage} className="text-sm">
                              {stage}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {selectedStages.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {selectedStages.map((stage) => (
                            <Badge
                              key={stage}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {stage}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeStage(stage)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Company stages you prefer to invest in (select all that
                    apply).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Interested Industries - Updated to use INDUSTRIES_LIST */}
            <FormField
              control={form.control}
              name="interestedIndustries"
              render={() => (
                <FormItem>
                  <FormLabel>Interested Industries *</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {INDUSTRIES_LIST.map((industry) => (
                          <div
                            key={industry}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={industry}
                              checked={selectedIndustries.includes(industry)}
                              onCheckedChange={() => toggleIndustry(industry)}
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
                                onClick={() => removeIndustry(industry)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Industries you prefer to invest in. This helps entrepreneurs
                    find you.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Countries to Receive Pitches From */}
            <FormField
              control={form.control}
              name="pitchCountries"
              render={() => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Countries to Receive Pitches From *
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto border rounded-lg p-4">
                        {COUNTRIES.map((country) => (
                          <div
                            key={country}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`pitch-${country}`}
                              checked={selectedPitchCountries.includes(country)}
                              onCheckedChange={() =>
                                togglePitchCountry(country)
                              }
                            />
                            <Label
                              htmlFor={`pitch-${country}`}
                              className="text-sm"
                            >
                              {country}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {selectedPitchCountries.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {selectedPitchCountries.map((country) => (
                            <Badge
                              key={country}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {country}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removePitchCountry(country)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Select countries where you want to receive pitch
                    opportunities from entrepreneurs.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Max Investments Per Year */}
            <FormField
              control={form.control}
              name="maxInvestmentsPerYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Investments Per Year *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="5"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    How many companies do you plan to invest in per year?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Previous Investments */}
            <FormField
              control={form.control}
              name="previousInvestments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Previous Investments *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Total number of investments you&apos;ve made to date.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Saving..." : "Complete Investor Profile"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default InvestorProfileForm;
