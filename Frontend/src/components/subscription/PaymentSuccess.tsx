"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { useHandlePaymentSuccess } from "@/hooks/subscription/useSubscription";

export default function PaymentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  const { mutate: handlePaymentSuccess, isPending } = useHandlePaymentSuccess();

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    // Process the successful payment
    handlePaymentSuccess(sessionId, {
      onSuccess: () => {
        setStatus("success");
      },
      onError: () => {
        setStatus("error");
      },
    });
  }, [sessionId, handlePaymentSuccess]);

  const handleContinue = () => {
    router.push("/account");
  };

  const handleBackToPricing = () => {
    router.push("/pricing");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-secondary/20 to-background relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-accent/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-success/10 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-4000"></div>

      <Card className="w-full max-w-md mx-4 glass-morphism border-0 gradient-border shadow-lg animate-slide-in-bottom">
        {status === "loading" || isPending ? (
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-3 animate-pulse">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  Processing your payment...
                </h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while we confirm your subscription.
                </p>
              </div>
            </div>
          </CardContent>
        ) : status === "error" ? (
          <>
            <CardHeader className="text-center">
              <div className="rounded-full bg-destructive/10 dark:bg-destructive/20 p-3 w-fit mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl text-destructive">
                Payment Error
              </CardTitle>
              <CardDescription>
                There was an issue processing your payment. Please try again or
                contact support.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={handleBackToPricing}
                  className="flex-1 hover-lift"
                >
                  Back to Pricing
                </Button>
                <Button
                  onClick={() => router.push("/contact")}
                  className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground hover-lift"
                >
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="text-center">
              <div className="rounded-full bg-success/10 dark:bg-success/20 p-3 w-fit mx-auto mb-4 animate-glow">
                <Check className="h-8 w-8 text-success" />
              </div>
              <CardTitle className="text-xl text-gradient">
                Payment Successful!
              </CardTitle>
              <CardDescription>
                Your subscription has been activated successfully. Welcome to
                KonnectSphere!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-radial from-success/5 to-transparent dark:from-success/10 dark:to-transparent border border-success/20 dark:border-success/30 rounded-lg p-4 scale-in">
                <h4 className="font-medium text-gradient mb-2">
                  What&apos;s next?
                </h4>
                <ul className="text-sm text-foreground/80 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span> Access your
                    subscription dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span> Create and manage
                    your pitches
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span> Connect with
                    investors worldwide
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span> Get priority
                    customer support
                  </li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="flex-1 hover-lift"
                >
                  Go to Homepage
                </Button>
                <Button
                  onClick={handleContinue}
                  className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground hover-lift"
                >
                  Manage Subscription
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
