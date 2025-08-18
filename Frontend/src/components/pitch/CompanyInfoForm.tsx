"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import FormSection from "./shared/FormSection";
import { CompanyInfoFormData } from "@/lib/types";
import {
  Globe,
  Info,
  Phone,
  Building,
  DollarSign,
  ChevronRight,
  Search,
} from "lucide-react";
import { COUNTRIES } from "@/lib/constants";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface CompanyInfoFormProps {
  onSubmit: (data: CompanyInfoFormData) => void;
  onHelpContextChange: (context: string) => void;
  formData?: {
    companyInfo?: {
      pitchTitle?: string;
      website?: string;
      country?: string;
      phoneNumber?: string;
      industry1?: string;
      industry2?: string;
      stage?: string;
      idealInvestorRole?: string;
      previousRaised?: string;
      raisingAmount?: string;
      raisedSoFar?: string;
      minimumInvestment?: string;
    };
  };
}

// Form validation schema
const formSchema = z.object({
  pitchTitle: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must not exceed 100 characters"),
  website: z
    .string()
    .url("Please enter a valid URL")
    .min(1, "Website URL is required"),
  country: z.string().min(1, "Country is required"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\+?[0-9\s\-()]+$/, "Please enter a valid phone number"),
  industry1: z.string().min(1, "Primary industry is required"),
  industry2: z.string().optional(),
  stage: z.string().min(1, "Company stage is required"),
  idealInvestorRole: z.string().min(1, "Ideal investor role is required"),
  previousRaised: z.string().optional(),
  raisingAmount: z.string().min(1, "Total raising amount is required"),
  raisedSoFar: z.string().optional(),
  minimumInvestment: z.string().min(1, "Minimum investment is required"),
});

const investorRoles = [
  { value: "daily", label: "Daily Involvement" },
  { value: "weekly", label: "Weekly Involvement" },
  { value: "monthly", label: "Monthly Involvement" },
  { value: "any", label: "Any" },
];

// Company stages
const companyStages = [
  { value: "achieving-sales", label: "Achieving Sales" },
  { value: "breaking-even", label: "Breaking Even" },
  { value: "mvp-finished", label: "MVP/Finished Product" },
  { value: "prestartup-rd", label: "PreStartup/R&D" },
  { value: "profitable", label: "Profitable" },
  { value: "other", label: "Other" },
];

// Industries - Updated to match filtering system
const INDUSTRIES_LIST = [
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

// Convert industries to value-label format for form usage
const industries = INDUSTRIES_LIST.map((industry) => ({
  value: industry,
  label: industry,
}));

// Funding amount options
const AMOUNT_OPTIONS = [
  { value: "0", label: "$0" },
  { value: "10000", label: "$10,000" },
  { value: "50000", label: "$50,000" },
  { value: "100000", label: "$100,000" },
  { value: "250000", label: "$250,000" },
  { value: "500000", label: "$500,000" },
  { value: "1000000", label: "$1,000,000" },
  { value: "1500000", label: "$1,500,000" },
  { value: "2000000", label: "$2,000,000" },
  { value: "2500000", label: "$2,500,000" },
  { value: "3000000", label: "$3,000,000" },
  { value: "4500000", label: "$4,500,000" },
  { value: "5000000", label: "$5,000,000" },
  { value: "6000000", label: "$6,000,000" },
  { value: "7000000", label: "$7,000,000" },
  { value: "8000000", label: "$8,000,000" },
  { value: "9000000", label: "$9,000,000" },
  { value: "10000000", label: "$10,000,000" },
  { value: "12500000", label: "$12,500,000" },
  { value: "15000000", label: "$15,000,000" },
  { value: "20000000", label: "$20,000,000" },
  { value: "25000000", label: "$25,000,000" },
  { value: "30000000", label: "$30,000,000" },
  { value: "35000000", label: "$35,000,000" },
  { value: "40000000", label: "$40,000,000" },
  { value: "45000000", label: "$45,000,000" },
  { value: "50000000", label: "$50,000,000" },
];

// Minimum investment options
const MINIMUM_INVESTMENT_OPTIONS = [
  { value: "0", label: "$0" },
  { value: "10000", label: "$10,000" },
  { value: "50000", label: "$50,000" },
  { value: "100000", label: "$100,000" },
  { value: "250000", label: "$250,000" },
  { value: "500000", label: "$500,000" },
  { value: "1000000", label: "$1,000,000" },
  { value: "1500000", label: "$1,500,000" },
  { value: "2000000", label: "$2,000,000" },
  { value: "2500000", label: "$2,500,000" },
  { value: "3000000", label: "$3,000,000" },
  { value: "4500000", label: "$4,500,000" },
  { value: "5000000", label: "$5,000,000" },
  { value: "6000000", label: "$6,000,000" },
  { value: "7000000", label: "$7,000,000" },
  { value: "8000000", label: "$8,000,000" },
  { value: "9000000", label: "$9,000,000" },
  { value: "10000000", label: "$10,000,000" },
  { value: "12500000", label: "$12,500,000" },
  { value: "15000000", label: "$15,000,000" },
  { value: "20000000", label: "$20,000,000" },
  { value: "25000000", label: "$25,000,000" },
  { value: "30000000", label: "$30,000,000" },
  { value: "35000000", label: "$35,000,000" },
  { value: "40000000", label: "$40,000,000" },
  { value: "45000000", label: "$45,000,000" },
  { value: "50000000", label: "$50,000,000" },
];

const CompanyInfoForm = ({
  onSubmit,
  onHelpContextChange,
  formData,
}: CompanyInfoFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pitchTitle: formData?.companyInfo?.pitchTitle || "",
      website: formData?.companyInfo?.website || "",
      country: formData?.companyInfo?.country || "",
      phoneNumber: formData?.companyInfo?.phoneNumber || "",
      industry1: formData?.companyInfo?.industry1 || "",
      industry2: formData?.companyInfo?.industry2 || "",
      stage: formData?.companyInfo?.stage || "",
      idealInvestorRole: formData?.companyInfo?.idealInvestorRole || "",
      previousRaised: formData?.companyInfo?.previousRaised || "0",
      raisingAmount: formData?.companyInfo?.raisingAmount || "",
      raisedSoFar: formData?.companyInfo?.raisedSoFar || "0",
      minimumInvestment: formData?.companyInfo?.minimumInvestment || "",
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values as CompanyInfoFormData);
  };

  const handleFieldFocus = (fieldName: string) => {
    switch (fieldName) {
      case "pitchTitle":
        onHelpContextChange("pitch-title");
        break;
      case "website":
        onHelpContextChange("website-url");
        break;
      case "country":
        onHelpContextChange("country");
        break;
      case "industry1":
      case "industry2":
        onHelpContextChange("industry-selection");
        break;
      case "raisingAmount":
      case "raisedSoFar":
        onHelpContextChange("funding-amount");
        break;
      case "minimumInvestment":
        onHelpContextChange("minimum-investment");
        break;
      case "phoneNumber":
        onHelpContextChange("phone-number");
        break;
      case "stage":
        onHelpContextChange("stage");
        break;
      case "idealInvestorRole":
        onHelpContextChange("ideal-investor-role");
        break;
      default:
        onHelpContextChange("");
    }
  };

  // Add state for popover
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormSection
          title="Basic Information"
          description="Tell us about your company and what makes it unique"
        >
          <FormField
            control={form.control}
            name="pitchTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pitch Title</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="e.g., Revolutionary AI Solution for Healthcare"
                      {...field}
                      className="pl-10"
                      onFocus={() => handleFieldFocus("pitchTitle")}
                    />
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  </div>
                </FormControl>
                <FormDescription>
                  Create a compelling title that clearly conveys your value
                  proposition
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="https://www.example.com"
                        {...field}
                        className="pl-10"
                        onFocus={() => handleFieldFocus("website")}
                      />
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="+1 (555) 123-4567"
                        {...field}
                        className="pl-10"
                        onFocus={() => handleFieldFocus("phoneNumber")}
                      />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Popover
              open={countryPopoverOpen}
              onOpenChange={setCountryPopoverOpen}
              modal={false} // ensures popover is anchored below
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={countryPopoverOpen}
                  className={cn(
                    "w-full justify-between",
                    !form.watch("country") && "text-muted-foreground"
                  )}
                  onClick={() => {
                    handleFieldFocus("country");
                    setCountryPopoverOpen((open) => !open);
                  }}
                >
                  {form.watch("country") || "Select country..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-full p-0"
                align="start"
                sideOffset={4}
              >
                <Command>
                  <CommandInput placeholder="Search country..." />
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-y-auto">
                    {COUNTRIES.map((country) => (
                      <CommandItem
                        key={country}
                        onSelect={() => {
                          form.setValue("country", country, {
                            shouldValidate: true,
                          });
                          setCountryPopoverOpen(false);
                        }}
                      >
                        {country}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            {form.formState.errors.country && (
              <p className="text-sm text-destructive">
                {form.formState.errors.country.message}
              </p>
            )}
          </div>
        </FormSection>

        <FormSection
          title="Industry & Stage"
          description="Help investors understand your market and company maturity"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="industry1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Industry</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    onOpenChange={() => handleFieldFocus("industry1")}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your primary industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry.value} value={industry.value}>
                          {industry.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="industry2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secondary Industry (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    onOpenChange={() => handleFieldFocus("industry2")}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a secondary industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry.value} value={industry.value}>
                          {industry.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    If your company spans multiple industries
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="stage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Stage</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  onOpenChange={() => handleFieldFocus("stage")}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your company's current stage" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {companyStages.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="idealInvestorRole"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ideal Investor Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  onOpenChange={() => handleFieldFocus("idealInvestorRole")}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select preferred investor involvement" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {investorRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  What level of involvement you prefer from your investors
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection
          title="Funding Information"
          description="Tell investors about your funding goals"
        >
          <FormField
            control={form.control}
            name="previousRaised"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <span className="flex items-center">
                    Previous Round Raised Amount (Optional)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 ml-2 text-slate-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-60 text-sm">
                            If you have raised money previously, enter the
                            amount to help investors understand your funding
                            history
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      onOpenChange={() => handleFieldFocus("previousRaised")}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full pl-10">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <SelectValue placeholder="Select previous raised amount" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AMOUNT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="raisingAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Raising Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        onOpenChange={() => handleFieldFocus("raisingAmount")}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full pl-10">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <SelectValue placeholder="Select raising amount" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AMOUNT_OPTIONS.slice(1).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="raisedSoFar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Raised So Far (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        onOpenChange={() => handleFieldFocus("raisedSoFar")}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full pl-10">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <SelectValue placeholder="Select amount raised so far" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AMOUNT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="minimumInvestment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Investment</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      onOpenChange={() => handleFieldFocus("minimumInvestment")}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full pl-10">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <SelectValue placeholder="Select minimum investment amount" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MINIMUM_INVESTMENT_OPTIONS.slice(1).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </FormControl>
                <FormDescription>
                  The minimum amount an investor can contribute
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white"
            size="lg"
          >
            Continue to Pitch & Deal
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CompanyInfoForm;
