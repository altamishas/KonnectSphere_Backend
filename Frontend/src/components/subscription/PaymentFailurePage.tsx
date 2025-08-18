"use client";

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
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Home,
  MessageCircle,
  CreditCard,
  ShieldX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function PaymentFailurePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled");

  const handleRetry = () => {
    router.push("/pricing");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  const handleContactSupport = () => {
    router.push("/contact");
  };

  const getFailureType = () => {
    if (cancelled === "true") {
      return {
        title: "Payment Cancelled",
        description:
          "You cancelled the payment process. No charges were made to your account.",
        icon: XCircle,
        gradientClasses:
          "from-yellow-500/20 to-primary/20 dark:from-yellow-500/10 dark:to-primary/10",
        iconGradient: "from-yellow-500 to-primary",
        textGradient: "from-yellow-500 to-primary",
        borderColor: "border-yellow-500/20 dark:border-yellow-500/30",
      };
    }

    return {
      title: "Payment Failed",
      description:
        "We couldn't process your payment. Please check your payment method and try again.",
      icon: AlertTriangle,
      gradientClasses:
        "from-red-500/20 to-yellow-500/20 dark:from-red-500/10 dark:to-yellow-500/10",
      iconGradient: "from-red-500 to-yellow-500",
      textGradient: "from-red-500 to-yellow-500",
      borderColor: "border-red-500/20 dark:border-red-500/30",
    };
  };

  const failureType = getFailureType();
  const IconComponent = failureType.icon;
  // const isCancel = cancelled === "true";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="relative">
        {/* Animated background elements */}
        <div className="absolute -inset-40 opacity-30">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-secondary/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        <Card
          className={cn(
            "w-full max-w-lg mx-4 backdrop-blur-lg border-2 shadow-lg",
            failureType.borderColor
          )}
        >
          <CardHeader className="text-center pb-6">
            <div className="relative mx-auto mb-6">
              <div
                className={cn(
                  "rounded-full bg-gradient-to-r p-4 shadow-lg",
                  failureType.iconGradient
                )}
              >
                <IconComponent className="h-16 w-16 text-background" />
              </div>
              <div
                className={cn(
                  "absolute inset-0 rounded-full bg-gradient-to-r animate-pulse opacity-75",
                  failureType.iconGradient
                )}
              ></div>
              <div className="absolute -top-1 -right-1">
                <ShieldX className="h-6 w-6 text-muted-foreground animate-bounce" />
              </div>
            </div>
            <CardTitle
              className={cn(
                "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                failureType.textGradient
              )}
            >
              {failureType.title}
            </CardTitle>
            <CardDescription className="text-lg">
              {failureType.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Error Details */}
            <div
              className={cn(
                "bg-gradient-to-r rounded-xl p-6 border",
                failureType.gradientClasses,
                failureType.borderColor
              )}
            >
              <h4 className="font-bold mb-4 flex items-center text-foreground">
                <AlertTriangle className="h-5 w-5 mr-2" />
                What you can do:
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4 mr-3 text-primary" />
                  Check your payment method details
                </li>
                <li className="flex items-center text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 mr-3 text-green-500" />
                  Try a different payment method
                </li>
                <li className="flex items-center text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4 mr-3 text-secondary" />
                  Contact our support team for help
                </li>
              </ul>
            </div>

            {/* Common Issues */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-card/50 rounded-lg p-4 border border-border">
                <h5 className="font-semibold text-sm text-card-foreground mb-2">
                  Common Issues
                </h5>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Insufficient funds in account</li>
                  <li>• Card expired or blocked</li>
                  <li>• Incorrect billing information</li>
                  <li>• Bank security restrictions</li>
                </ul>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
              <Badge variant="outline" className="px-4 py-2">
                {cancelled === "true" ? "Payment Cancelled" : "Payment Failed"}
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleRetry}
                className="font-medium text-lg py-3"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Try Again
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleContactSupport}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Get Help
                </Button>
                <Button variant="outline" onClick={handleGoHome}>
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
