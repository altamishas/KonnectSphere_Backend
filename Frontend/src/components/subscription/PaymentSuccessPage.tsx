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
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  CreditCard,
  Calendar,
  ArrowRight,
  Home,
  Settings,
} from "lucide-react";
import { useHandlePaymentSuccess } from "@/hooks/subscription/useSubscription";
import { Badge } from "@/components/ui/badge";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { mutate: handlePaymentSuccess, isPending } = useHandlePaymentSuccess();

  useEffect(() => {
    if (!sessionId) {
      setErrorMessage(
        "Payment session not found. The payment link may be invalid or expired."
      );
      setStatus("error");
      return;
    }

    // Set a timeout to handle long-running requests
    const timeoutId = setTimeout(() => {
      setErrorMessage(
        "Payment processing is taking longer than expected. Please check your subscription status or contact support."
      );
      setStatus("error");
    }, 30000); // 30 seconds timeout

    // Process the successful payment
    handlePaymentSuccess(sessionId, {
      onSuccess: (data) => {
        clearTimeout(timeoutId);
        console.log("✅ Payment processed successfully:", data);
        setStatus("success");
        setTimeout(() => {
          console.log("🔄 Forcing page reload to refresh subscription data");
          window.location.href = "/account";
        }, 2000);
      },
      onError: (error) => {
        clearTimeout(timeoutId);
        console.log("❌ Payment processing failed:", error);
        const message =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ||
          "Failed to process payment. Please contact support if your payment was charged.";
        setErrorMessage(message);
        setStatus("error");
      },
    });

    // Cleanup timeout on unmount
    return () => {
      clearTimeout(timeoutId);
    };
  }, [sessionId, handlePaymentSuccess, searchParams]);

  const handleContinue = () => {
    router.push("/account");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  if (status === "loading" || isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-radial from-background via-primary/5 to-accent/5">
        <div className="relative">
          {/* Animated background elements */}
          <div className="absolute -inset-40 opacity-30">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-accent/30 rounded-full mix-blend-multiply filter blur-xl animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-secondary/30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
          </div>

          <Card className="w-full max-w-md mx-4 glass-morphism scale-in shadow-lg">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative">
                  <div className="rounded-full bg-gradient-to-r from-primary to-accent p-4 shadow-lg animate-pulse-slow">
                    <Loader2 className="h-12 w-12 text-primary-foreground animate-spin" />
                  </div>
                </div>
                <div className="space-y-3 slide-up">
                  <h3 className="text-2xl font-bold text-gradient">
                    Processing Payment
                  </h3>
                  <p className="text-base text-muted-foreground text-balance">
                    Verifying your payment and activating your subscription...
                  </p>
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-accent rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-chart-3 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-radial from-background via-destructive/5 to-warning/5">
        <div className="relative">
          {/* Animated background elements */}
          <div className="absolute -inset-40 opacity-30">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-destructive/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-warning/20 rounded-full mix-blend-multiply filter blur-xl animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
          </div>

          <Card className="w-full max-w-md mx-4 glass-morphism gradient-border scale-in shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="relative mx-auto mb-4 fade-in">
                <div className="rounded-full bg-gradient-to-r from-destructive to-warning p-4 shadow-lg">
                  <AlertCircle className="h-12 w-12 text-destructive-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gradient slide-up">
                Payment Error
              </CardTitle>
              <CardDescription className="text-base slide-up animation-delay-2000">
                {errorMessage ||
                  "There was an issue processing your payment. Please try again or contact support."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 slide-in-bottom">
                <h4 className="font-semibold text-destructive mb-2">
                  What happened?
                </h4>
                <ul className="text-sm text-destructive/80 space-y-1">
                  <li>• Payment was declined or incomplete</li>
                  <li>• Session expired or invalid</li>
                  <li>• Subscription activation failed</li>
                </ul>
              </div>
              <div className="flex flex-col gap-3 animate-slide-in-bottom">
                <Button
                  onClick={() => router.push("/pricing")}
                  className="bg-gradient-to-r from-destructive to-warning hover:from-destructive/90 hover:to-warning/90 text-destructive-foreground font-medium hover:cursor-pointer"
                >
                  Try Again
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/contact")}
                  className="border-destructive/30 text-destructive hover:bg-destructive/5 hover:cursor-pointer"
                >
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-radial from-background via-success/5 to-primary/5">
      <div className="relative">
        {/* Animated background elements */}
        <div className="absolute -inset-40 opacity-30">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-success/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-accent/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        <Card className="w-full max-w-lg mx-4 glass-morphism gradient-border scale-in shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="relative mx-auto mb-6 fade-in">
              <div className="rounded-full bg-gradient-to-r from-success to-primary p-4 shadow-lg animate-pulse-slow">
                <CheckCircle2 className="h-16 w-16 text-success-foreground" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-6 w-6 text-primary animate-bounce" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gradient slide-up">
              Payment Successful!
            </CardTitle>
            <CardDescription className="text-lg slide-up animation-delay-2000">
              🎉 Welcome to KonnectSphere Premium! Your subscription is now
              active.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Success Features */}
            <div className="bg-gradient-to-r from-success/5 to-primary/5 border border-success/20 rounded-xl p-6 animate-slide-in-bottom">
              <h4 className="font-bold text-success mb-4 flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                You now have access to:
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center text-sm text-success/80">
                  <CheckCircle2 className="h-4 w-4 mr-3 text-success" />
                  Enhanced pitch visibility and reach
                </li>
                <li className="flex items-center text-sm text-success/80">
                  <CheckCircle2 className="h-4 w-4 mr-3 text-success" />
                  Priority investor matching
                </li>
                <li className="flex items-center text-sm text-success/80">
                  <CheckCircle2 className="h-4 w-4 mr-3 text-success" />
                  Advanced analytics dashboard
                </li>
                <li className="flex items-center text-sm text-success/80">
                  <CheckCircle2 className="h-4 w-4 mr-3 text-success" />
                  Premium customer support
                </li>
              </ul>
            </div>

            {/* Quick Actions */}
            <div
              className="grid grid-cols-2 gap-3 animate-slide-in-bottom"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="glass-morphism rounded-lg p-4 hover-lift">
                <CreditCard className="h-6 w-6 text-primary mb-2" />
                <h5 className="font-semibold text-sm text-secondary-foreground">
                  Payment
                </h5>
                <p className="text-xs text-muted-foreground">
                  Processed successfully
                </p>
                <Badge className="mt-2 bg-success/10 text-success border-success/20">
                  Confirmed
                </Badge>
              </div>
              <div className="glass-morphism rounded-lg p-4 hover-lift">
                <Calendar className="h-6 w-6 text-accent mb-2" />
                <h5 className="font-semibold text-sm text-secondary-foreground">
                  Billing
                </h5>
                <p className="text-xs text-muted-foreground">Monthly renewal</p>
                <Badge className="mt-2 bg-accent/10 text-accent border-accent/20">
                  Active
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              className="flex flex-col gap-3 animate-slide-in-bottom"
              style={{ animationDelay: "0.4s" }}
            >
              <Button
                onClick={handleContinue}
                className="bg-gradient-to-r from-success to-primary hover:from-success/90 hover:to-primary/90 text-success-foreground font-medium text-lg py-3 animate-glow"
              >
                <Settings className="mr-2 h-5 w-5" />
                Manage Subscription
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                onClick={handleGoHome}
                className="border-success/30 text-success hover:bg-success/5"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
