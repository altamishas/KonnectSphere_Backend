import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import FormSection from "./shared/FormSection";
import { PackagesFormData } from "@/lib/types";
import PricingPlans from "@/components/shared/PricingPlans";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

interface PackagesFormProps {
  onSubmit: (data: PackagesFormData) => void;
  onHelpContextChange: (context: string) => void;
  formData?: {
    packages?: {
      selectedPackage?: string;
      agreeToTerms?: boolean;
    };
  };
}

// Form validation schema
const formSchema = z.object({
  selectedPackage: z.string().min(1, "Please select a package"),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

const PackagesForm = ({
  onSubmit,
  onHelpContextChange,
  formData,
}: PackagesFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedPackage: formData?.packages?.selectedPackage || "premium",
      agreeToTerms: formData?.packages?.agreeToTerms || false,
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const packageData: PackagesFormData = {
      selectedPackage: values.selectedPackage,
      agreeToTerms: values.agreeToTerms,
    };
    onSubmit(packageData);
  };

  const handleFieldFocus = (fieldName: string) => {
    if (fieldName === "packages") {
      onHelpContextChange("packages-selection");
    } else {
      onHelpContextChange("");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormSection
          title="Choose Your Package"
          description="Select the package that best fits your fundraising needs"
        >
          <FormField
            control={form.control}
            name="selectedPackage"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormControl>
                  <PricingPlans
                    userType="entrepreneur"
                    selectedPlan={field.value}
                    onPlanSelect={(planId) => {
                      handleFieldFocus("packages");
                      field.onChange(planId);
                    }}
                    showRadioButtons={true}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="mt-8">
            <FormField
              control={form.control}
              name="agreeToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <label
                      htmlFor="agreeToTerms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-primary hover:underline"
                        target="_blank"
                      >
                        terms and conditions
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy-policy"
                        className="text-primary hover:underline"
                        target="_blank"
                      >
                        privacy policy
                      </Link>
                    </label>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        <div className="flex justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.history.back();
            }}
          >
            Back
          </Button>

          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-black"
            size="lg"
          >
            Continue
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PackagesForm;
