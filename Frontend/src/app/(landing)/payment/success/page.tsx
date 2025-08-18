import { Suspense } from "react";
import PaymentSuccessPage from "@/components/subscription/PaymentSuccessPage";

function PaymentSuccessLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/20 via-primary/5 to-amber-50 dark:from-slate-950 dark:via-amber-950/20 dark:to-secondary/5">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-ping"></div>
        </div>
        <p className="text-lg font-medium bg-gradient-to-r from-primary to-primary/90 bg-clip-text text-transparent">
          Processing payment status...
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPageWrapper() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessPage />
    </Suspense>
  );
}
