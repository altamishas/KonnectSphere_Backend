"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useForgotPassword } from "@/hooks/auth/useResetPassword";
import { LucideIcon } from "@/components/ui-icons";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { mutate: forgotPasswordMutation, isPending } = useForgotPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    forgotPasswordMutation(
      { email },
      {
        onSuccess: () => {
          setSubmitted(true);
          toast.success(
            "If your email exists in our system, you will receive a password reset link."
          );
        },
      }
    );
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(45%_40%_at_50%_40%,rgba(217,197,121,0.1),transparent)]">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link
              href="/"
              className="mx-auto flex items-center justify-center text-2xl my-4 space-x-2"
            >
              <div className="rounded-full bg-primary p-1 text-primary-foreground">
                <LucideIcon name="Mic" className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl">
                Speak<span className="text-primary">Ease</span>
              </span>
            </Link>
            <h2 className="text-2xl font-bold">Check Your Email</h2>
            <div className="mt-6 text-center">
              <div className="flex justify-center mb-4">
                <LucideIcon name="Mail" className="h-16 w-16 text-primary" />
              </div>
              <p className="text-lg mb-4">
                We&apos;ve sent a password reset link to{" "}
                <strong>{email}</strong>
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Please check your email inbox and click on the provided link to
                reset your password. If you don&apos;t receive an email within a
                few minutes, check your spam folder.
              </p>
              <Button variant="outline" asChild className="mt-4">
                <Link href="/login">Return to Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(45%_40%_at_50%_40%,rgba(217,197,121,0.1),transparent)]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link
            href="/"
            className="mx-auto flex items-center justify-center text-2xl my-4 space-x-2"
          >
            <div className="rounded-full bg-primary p-1 text-primary-foreground">
              <LucideIcon name="Mic" className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl">
              Speak<span className="text-primary">Ease</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold">Forgot Your Password?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No worries! Enter your email and well send you reset instructions.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 bg-card p-8 rounded-lg border border-border/60"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
              />
            </div>
          </div>

          <Button
            className="w-full bg-primary hover:bg-[#c8b66c] text-white cursor-pointer"
            type="submit"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <LucideIcon
                  name="Loader2"
                  className="mr-2 h-4 w-4 animate-spin"
                />
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>

          <div className="text-center text-sm">
            <Link href="/login" className="text-primary hover:underline">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
