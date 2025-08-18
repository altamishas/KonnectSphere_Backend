"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CircleDollarSign,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  User,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRegister } from "@/hooks/auth/useRegister";
import { useAppSelector } from "@/hooks/hooks";
import { toast } from "sonner";
import { LucideIcon } from "@/components/ui-icons";
import { Label } from "@/components/ui/label";

const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50, { message: "Name must be less than 50 characters long" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  agreedToTerms: z.boolean().refine((value) => value === true, {
    message: "You must accept the terms and privacy policy",
  }),
  role: z.enum(["Entrepreneur", "Investor"]),
  // Do not allow selecting paid plan at registration; default is Free on backend
  isAccreditedInvestor: z.boolean().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const { mutate: register, isPending } = useRegister();
  const { isAuthenticated, error } = useAppSelector((state) => state.auth);
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "Entrepreneur";

  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: role as "Entrepreneur" | "Investor",
      agreedToTerms: false,
      isAccreditedInvestor: false,
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      toast.success("Registration successful!");
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Show error toast if registration fails
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  function onSubmit(values: RegisterFormValues) {
    register(
      { ...values },
      {
        onSuccess: () => {
          router.push("/verify-email");
        },
      }
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-12">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="mb-6 flex items-center space-x-2">
            <CircleDollarSign className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">
              Konnect<span className="text-primary">Sphere</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-2 text-muted-foreground">
            Join KonnectSphere and start your investment journey
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Enter your information to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>I am a(n):</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              className="border-2 border-primary"
                              value="Entrepreneur"
                              id="entrepreneur"
                            />
                            <Label htmlFor="entrepreneur">Entrepreneur</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              className="border-2 border-primary"
                              value="Investor"
                              id="Investor"
                            />
                            <Label htmlFor="Investor">Investor</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="John Smith"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="name@example.com"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            className="pl-10"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 h-8 w-8"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            <span className="sr-only">
                              {showPassword ? "Hide password" : "Show password"}
                            </span>
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agreedToTerms"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-3 space-y-0">
                      <FormControl>
                        <div
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-md border-2 border-primary",
                            field.value
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-primary"
                          )}
                          onClick={() => field.onChange(!field.value)}
                        >
                          {field.value && <Check className="h-3.5 w-3.5" />}
                        </div>
                      </FormControl>

                      <div className="text-sm leading-snug">
                        <label className="font-medium">
                          I agree to the{" "}
                          <Link
                            href="/legal/terms"
                            className="text-primary hover:underline"
                          >
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link
                            href="/legal/privacy"
                            className="text-primary hover:underline"
                          >
                            Privacy Policy
                          </Link>
                        </label>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("role") === "Investor" && (
                  <FormField
                    control={form.control}
                    name="isAccreditedInvestor"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-3 space-y-0">
                        <FormControl>
                          <div
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-md border-2 mt-1",
                              field.value
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-primary"
                            )}
                            onClick={() => field.onChange(!field.value)}
                          >
                            {field.value && <Check className="h-3.5 w-3.5" />}
                          </div>
                        </FormControl>
                        <div className="text-sm leading-snug">
                          <label className="font-semibold">
                            I certify that I am an accredited, qualified or
                            sophisticated investor.
                          </label>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? (
                    <>
                      <LucideIcon
                        name="Loader2"
                        className="mr-2 h-4 w-4 animate-spin"
                      />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary/80"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
