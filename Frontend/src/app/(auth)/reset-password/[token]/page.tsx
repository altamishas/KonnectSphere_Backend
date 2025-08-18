"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LucideIcon } from "@/components/ui-icons";
import {
  useVerifyResetToken,
  useResetPassword,
} from "@/hooks/auth/useResetPassword";
import { AuthError } from "@/lib/types";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();

  const token = params?.token as string;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isLoading, isError, error } = useVerifyResetToken(token);
  const { mutate: resetPasswordMutation, isPending } = useResetPassword();

  useEffect(() => {
    if (isError) {
      toast.error(
        (error as Error)?.message || "Invalid or expired reset token"
      );
      setTimeout(() => {
        router.push("/forgot-password");
      }, 3000);
    }
  }, [isError, error, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Trim whitespace from passwords before comparison
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    // Validate passwords
    if (trimmedPassword !== trimmedConfirmPassword) {
      toast.error("Passwords do not match");

      setIsSubmitting(false);
      return;
    }

    if (trimmedPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      setIsSubmitting(false);
      return;
    }

    resetPasswordMutation(
      { token, password: trimmedPassword },
      {
        onSuccess: () => {
          toast.success(
            "Password reset successful! You can now log in with your new password."
          );
          // Redirect to login page after successful reset
          setTimeout(() => {
            router.push("/login");
          }, 1500);
        },
        onError: (err) => {
          const error = err as AuthError;
          toast.error(
            error.message || "Failed to reset password. Please try again."
          );
          setIsSubmitting(false);
        },
        onSettled: () => {
          setIsSubmitting(false);
        },
      }
    );
  };

  // Show loading spinner while verifying token
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(45%_40%_at_50%_40%,rgba(217,197,121,0.1),transparent)]">
        <div className="flex flex-col items-center justify-center">
          <LucideIcon
            name="Loader2"
            className="h-10 w-10 animate-spin text-primary"
          />
          <p className="mt-4 text-lg">Verifying your reset token...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(45%_40%_at_50%_40%,rgba(217,197,121,0.1),transparent)]">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <LucideIcon
              name="AlertTriangle"
              className="h-16 w-16 text-red-500"
            />
            <h2 className="mt-4 text-2xl font-bold">Invalid Reset Link</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This password reset link is invalid or has expired.
            </p>
            <Button
              className="mt-8 bg-primary hover:bg-[#c8b66c] text-white"
              asChild
            >
              <Link href="/forgot-password">Request New Reset Link</Link>
            </Button>
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
              Konnect<span className="text-primary">Sphere</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold">Reset Your Password</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please enter your new password below
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 bg-card p-8 rounded-lg border border-border/60"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Password must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="w-full"
              />
            </div>
          </div>

          <Button
            className="w-full bg-primary hover:bg-[#c8b66c] text-white cursor-pointer"
            type="submit"
            disabled={isPending || isSubmitting}
          >
            {isPending || isSubmitting ? (
              <>
                <LucideIcon
                  name="Loader2"
                  className="mr-2 h-4 w-4 animate-spin"
                />
                Resetting Password...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
