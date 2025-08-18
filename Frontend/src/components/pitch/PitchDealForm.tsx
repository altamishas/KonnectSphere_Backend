import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  ChevronRight,
  ChevronLeft,
  PlusCircle,
  Trash2,
  Award,
  Target,
  Zap,
  TrendingUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FormSection from "./shared/FormSection";
import CharacterCount from "./shared/CharacterCount";
import { PitchDealFormData } from "@/lib/types";

interface PitchDealFormProps {
  onSubmit: (data: PitchDealFormData) => void;
  onHelpContextChange: (context: string) => void;
  formData?: {
    pitchDeal?: {
      summary?: string;
      business?: string;
      market?: string;
      progress?: string;
      objectives?: string;
      highlights?: { title: string; icon: string }[];
      dealType?: "equity" | "loan";
      financials?: { year: string; turnover: string; profit: string }[];
      tags?: string[];
    };
  };
}

// Form validation schema
const formSchema = z.object({
  summary: z
    .string()
    .min(10, "Summary must be at least 10 characters")
    .max(750, "Summary must not exceed 750 characters"),
  business: z
    .string()
    .min(10, "Business description must be at least 10 characters")
    .max(750, "Business description must not exceed 750 characters"),
  market: z
    .string()
    .min(10, "Market description must be at least 10 characters")
    .max(750, "Market description must not exceed 750 characters"),
  progress: z
    .string()
    .min(10, "Progress must be at least 10 characters")
    .max(750, "Progress must not exceed 750 characters"),
  objectives: z
    .string()
    .min(10, "Objectives must be at least 10 characters")
    .max(750, "Objectives must not exceed 750 characters"),
  highlights: z
    .array(
      z.object({
        title: z.string().min(1, "Highlight title is required"),
        icon: z.string(),
      })
    )
    .min(1, "At least one highlight is required")
    .max(4, "Maximum 4 highlights"),
  dealType: z.enum(["equity", "loan"]),
  financials: z
    .array(
      z.object({
        year: z.string().min(1, "Year is required"),
        turnover: z.string().min(1, "Turnover is required"),
        profit: z.string().min(1, "Profit is required"),
      })
    )
    .min(1, "At least one financial year is required"),
  tags: z
    .array(z.string())
    .min(1, "At least one tag is required")
    .max(10, "Maximum 10 tags"),
});

// Icons for highlights
const highlightIcons = [
  { id: "award", component: <Award className="h-5 w-5" /> },
  { id: "target", component: <Target className="h-5 w-5" /> },
  { id: "zap", component: <Zap className="h-5 w-5" /> },
  { id: "trending-up", component: <TrendingUp className="h-5 w-5" /> },
];

const PitchDealForm = ({
  onSubmit,
  onHelpContextChange,
  formData,
}: PitchDealFormProps) => {
  const [currentTag, setCurrentTag] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      summary: formData?.pitchDeal?.summary || "",
      business: formData?.pitchDeal?.business || "",
      market: formData?.pitchDeal?.market || "",
      progress: formData?.pitchDeal?.progress || "",
      objectives: formData?.pitchDeal?.objectives || "",
      highlights: formData?.pitchDeal?.highlights || [
        { title: "", icon: "award" },
      ],
      dealType: formData?.pitchDeal?.dealType || "equity",
      financials: formData?.pitchDeal?.financials || [
        { year: new Date().getFullYear().toString(), turnover: "", profit: "" },
      ],
      tags: formData?.pitchDeal?.tags || [],
    },
  });

  const highlights = form.watch("highlights");
  const dealType = form.watch("dealType");
  const financials = form.watch("financials");
  const tags = form.watch("tags");

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values as PitchDealFormData);
  };

  const handleFieldFocus = (fieldName: string) => {
    switch (fieldName) {
      case "summary":
      case "business":
      case "market":
      case "progress":
      case "objectives":
        onHelpContextChange("business-summary");
        break;
      case "financials":
        onHelpContextChange("financials");
        break;
      default:
        onHelpContextChange("");
    }
  };

  const addFinancialYear = () => {
    const currentFinancials = form.getValues("financials") || [];
    const lastYear = currentFinancials[currentFinancials.length - 1];
    const newYear =
      parseInt(lastYear?.year || new Date().getFullYear().toString()) + 1;

    form.setValue("financials", [
      ...currentFinancials,
      { year: newYear.toString(), turnover: "", profit: "" },
    ]);
  };

  const removeFinancialYear = (index: number) => {
    const currentFinancials = form.getValues("financials") || [];
    if (currentFinancials.length > 1) {
      form.setValue(
        "financials",
        currentFinancials.filter((_, i) => i !== index)
      );
    }
  };

  const addTag = () => {
    if (
      currentTag.trim() &&
      tags.length < 10 &&
      !tags.includes(currentTag.trim())
    ) {
      form.setValue("tags", [...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (index: number) => {
    form.setValue(
      "tags",
      tags.filter((_, i) => i !== index)
    );
  };

  const addHighlight = () => {
    const currentHighlights = form.getValues("highlights") || [];
    if (currentHighlights.length < 4) {
      form.setValue("highlights", [
        ...currentHighlights,
        { title: "", icon: "award" },
      ]);
    }
  };

  const removeHighlight = (index: number) => {
    const currentHighlights = form.getValues("highlights") || [];
    if (currentHighlights.length > 1) {
      form.setValue(
        "highlights",
        currentHighlights.filter((_, i) => i !== index)
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormSection
          title="Pitch Summary"
          description="Explain your business model and value proposition"
        >
          <FormField
            control={form.control}
            name="summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short Summary</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Write a concise overview of your business..."
                      className="min-h-[100px] resize-none"
                      {...field}
                      onFocus={() => handleFieldFocus("summary")}
                    />
                    <CharacterCount
                      current={field.value.length}
                      maximum={750}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Summarize your business in a way that&apos;s easy to
                  understand
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="business"
            render={({ field }) => (
              <FormItem>
                <FormLabel>The Business</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Describe what your business does in detail..."
                      className="min-h-[120px] resize-none"
                      {...field}
                      onFocus={() => handleFieldFocus("business")}
                    />
                    <CharacterCount
                      current={field.value.length}
                      maximum={750}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="market"
            render={({ field }) => (
              <FormItem>
                <FormLabel>The Market</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Describe your target market, size, and trends..."
                      className="min-h-[120px] resize-none"
                      {...field}
                      onFocus={() => handleFieldFocus("market")}
                    />
                    <CharacterCount
                      current={field.value.length}
                      maximum={750}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="progress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Progress / Proof</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Describe your progress, milestones, and traction..."
                      className="min-h-[120px] resize-none"
                      {...field}
                      onFocus={() => handleFieldFocus("progress")}
                    />
                    <CharacterCount
                      current={field.value.length}
                      maximum={750}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="objectives"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Objectives / Future</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Describe your future plans and objectives..."
                      className="min-h-[120px] resize-none"
                      {...field}
                      onFocus={() => handleFieldFocus("objectives")}
                    />
                    <CharacterCount
                      current={field.value.length}
                      maximum={750}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection
          title="Highlights"
          description="Showcase the most impressive aspects of your business"
        >
          <div className="space-y-4">
            {highlights.map((_, index) => (
              <div key={index} className="flex items-center space-x-3">
                <FormField
                  control={form.control}
                  name={`highlights.${index}.icon`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {highlightIcons.map((icon) => (
                              <SelectItem key={icon.id} value={icon.id}>
                                <div className="flex items-center space-x-2">
                                  {icon.component}
                                  <span className="capitalize">{icon.id}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`highlights.${index}.title`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder={`Highlight ${index + 1}`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeHighlight(index)}
                  disabled={highlights.length <= 1}
                  className="text-slate-500 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addHighlight}
              disabled={highlights.length >= 4}
              className="w-full border-dashed"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Highlight ({highlights.length}/4)
            </Button>
          </div>
        </FormSection>

        <FormSection
          title="Deal Structure"
          description="Specify the investment type and terms"
        >
          <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-lg mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                  Deal Type
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Choose between equity or loan financing
                </p>
              </div>

              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                <span
                  className={`text-sm font-medium ${
                    dealType === "equity"
                      ? "text-primary"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Equity
                </span>
                <FormField
                  control={form.control}
                  name="dealType"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value === "loan"}
                          onCheckedChange={(checked) => {
                            field.onChange(checked ? "loan" : "equity");
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <span
                  className={`text-sm font-medium ${
                    dealType === "loan"
                      ? "text-primary"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Loan
                </span>
              </div>
            </div>
          </div>

          <FormField
            control={form.control}
            name="financials"
            render={() => (
              <FormItem>
                <div>
                  <FormLabel>Financials</FormLabel>
                  <FormDescription className="mt-1 mb-3">
                    Provide historical and/or projected financial information
                  </FormDescription>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 bg-slate-100 dark:bg-slate-800 p-3 rounded-t-lg">
                    <div className="font-medium text-sm text-slate-900 dark:text-white">
                      Year
                    </div>
                    <div className="col-span-2 font-medium text-sm text-slate-900 dark:text-white">
                      Turnover
                    </div>
                    <div className="font-medium text-sm text-slate-900 dark:text-white">
                      Profit
                    </div>
                  </div>

                  {(financials || []).map((financial, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-4 gap-4 items-center"
                    >
                      <FormField
                        control={form.control}
                        name={`financials.${index}.year`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Year"
                                onFocus={() => handleFieldFocus("financials")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`financials.${index}.turnover`}
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  placeholder="Turnover"
                                  className="pl-8"
                                  onFocus={() => handleFieldFocus("financials")}
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="text-slate-500">$</span>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center space-x-2">
                        <FormField
                          control={form.control}
                          name={`financials.${index}.profit`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    {...field}
                                    placeholder="Profit"
                                    className="pl-8"
                                    onFocus={() =>
                                      handleFieldFocus("financials")
                                    }
                                  />
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-slate-500">$</span>
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFinancialYear(index)}
                          disabled={(financials || []).length <= 1}
                          className="text-slate-500 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addFinancialYear}
                    className="w-full border-dashed"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Year
                  </Button>
                </div>

                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection
          title="Tags & Keywords"
          description="Help investors find your pitch with relevant tags"
        >
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Input
                placeholder="Add a tag..."
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={addTag}
                disabled={tags.length >= 10 || !currentTag.trim()}
              >
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map((tag, index) => (
                <div
                  key={index}
                  className="flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-1 text-primary hover:text-primary/80"
                    onClick={() => removeTag(index)}
                  >
                    <span className="sr-only">Remove</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>
                </div>
              ))}
              {tags.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Add up to 10 tags to describe your business
                </p>
              )}
            </div>

            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center">
              <span>{tags.length}/10 tags</span>
              <div className="w-24 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mx-2">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(tags.length / 10) * 100}%` }}
                ></div>
              </div>
              <span>{10 - tags.length} remaining</span>
            </div>

            {form.formState.errors.tags && (
              <p className="text-sm font-medium text-red-500 mt-2">
                {form.formState.errors.tags.message}
              </p>
            )}
          </div>
        </FormSection>

        <div className="flex justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              // This would navigate back in a real implementation
              window.history.back();
            }}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Company Info
          </Button>

          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white"
            size="lg"
          >
            Continue to Team
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PitchDealForm;
