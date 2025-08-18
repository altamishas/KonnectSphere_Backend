import { Suspense } from "react";
import PaymentFailurePage from "@/components/subscription/PaymentFailurePage";

function PaymentFailureLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/10 via-warning/10 to-amber-50 dark:from-slate-950 dark:via-destructive/20 dark:to-warning/10">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-destructive/30 border-t-destructive rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-warning rounded-full animate-ping"></div>
        </div>
        <p className="text-lg font-medium bg-gradient-to-r from-destructive to-warning bg-clip-text text-transparent">
          Checking payment status...
        </p>
      </div>
    </div>
  );
}

export default function PaymentFailurePageWrapper() {
  return (
    <Suspense fallback={<PaymentFailureLoading />}>
      <PaymentFailurePage />
    </Suspense>
  );
}
