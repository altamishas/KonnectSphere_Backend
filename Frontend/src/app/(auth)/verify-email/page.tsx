"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/hooks/hooks";
import { useEmailVerification } from "@/hooks/auth/useEmailVerification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LucideIcon } from "@/components/ui-icons";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const [otp, setOtp] = useState("");
  const router = useRouter();
  const { verificationPending, verificationUserId } = useAppSelector(
    (state) => state.auth
  );
  const { verifyEmail, resendOTP } = useEmailVerification();

  useEffect(() => {
    // Only redirect if there's no verification pending
    if (!verificationPending || !verificationUserId) {
      router.push("/register");
    }
  }, [verificationPending, verificationUserId, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationUserId) {
      toast.error("Verification session expired. Please register again.");
      router.push("/register");
      return;
    }

    verifyEmail.mutate(
      { userId: verificationUserId, otp },
      {
        onSuccess: (data) => {
          toast.success("Email verified successfully!");

          // Check if user is an investor who needs to complete profile
          if (
            data.user?.role === "Investor" &&
            !data.user?.isInvestorProfileComplete
          ) {
            router.push("/complete-investor-profile");
          } else {
            router.push("/");
          }
        },
      }
    );
  };

  const handleResendOTP = () => {
    if (!verificationUserId) {
      toast.error("Verification session expired. Please register again.");
      router.push("/register");
      return;
    }
    resendOTP.mutate(verificationUserId);
  };

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
          <h2 className="text-2xl font-bold">Verify Your Email</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the 6-digit code we sent to your email
          </p>
        </div>

        <form
          onSubmit={handleVerify}
          className="mt-8 space-y-6 bg-card p-8 rounded-lg border border-border/60"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                name="otp"
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-[#c8b66c] text-white"
              disabled={verifyEmail.isPending}
            >
              {verifyEmail.isPending ? (
                <>
                  <LucideIcon
                    name="Loader2"
                    className="mr-2 h-4 w-4 animate-spin"
                  />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResendOTP}
              disabled={resendOTP.isPending}
            >
              {resendOTP.isPending ? (
                <>
                  <LucideIcon
                    name="Loader2"
                    className="mr-2 h-4 w-4 animate-spin"
                  />
                  Sending...
                </>
              ) : (
                "Resend Code"
              )}
            </Button>
          </div>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Wrong email?</span>{" "}
            <Link href="/register" className="text-primary hover:underline">
              Go back to Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
