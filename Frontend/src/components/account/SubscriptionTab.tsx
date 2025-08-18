"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CreditCard,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  useCurrentSubscription,
  useSubscriptionLogic,
  useRefreshSubscription,
  usePaymentHistory,
} from "@/hooks/subscription/useSubscription";

export default function SubscriptionTab() {
  const { data: subscription, isLoading } = useCurrentSubscription();
  const { data: paymentHistory } = usePaymentHistory();
  const { subscriptionEndDate, daysUntilRenewal, remainingPitches } =
    useSubscriptionLogic();

  const { mutate: refreshSubscription, isPending: isRefreshing } =
    useRefreshSubscription();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "trialing":
        return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            You don&apos;t have an active subscription. Subscribe to a plan to
            access premium features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => (window.location.href = "/pricing")}>
            View Pricing Plans
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {subscription.planName} Plan
                {getStatusBadge(subscription.status)}
              </CardTitle>
              <CardDescription>
                Your current subscription plan and details
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshSubscription()}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Pitches Remaining
              </div>
              <div className="text-sm font-medium">
                {remainingPitches} remaining
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Next Billing
              </div>
              <div className="text-sm">
                {subscriptionEndDate && (
                  <>
                    {subscriptionEndDate.toLocaleDateString()}
                    {daysUntilRenewal && daysUntilRenewal > 0 && (
                      <span className="text-muted-foreground ml-1">
                        ({daysUntilRenewal} days)
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/pricing")}
            >
              Change Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentHistory && paymentHistory.payments.length > 0 ? (
            <div className="space-y-3">
              {paymentHistory.payments.map((payment) => (
                <div
                  key={payment._id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {payment.status === "paid" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">${payment.amount}</span>
                    </div>
                    <Badge
                      variant={
                        payment.status === "paid" ? "secondary" : "destructive"
                      }
                    >
                      {payment.status}
                    </Badge>
                  </div>
                  {payment.invoiceUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(payment.invoiceUrl, "_blank")}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Invoice
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No payment history available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
