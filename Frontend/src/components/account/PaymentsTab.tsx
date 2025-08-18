"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  CreditCard,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Search,
  Receipt,
  TrendingUp,
  DollarSign,
  Eye,
  Filter,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  useCurrentSubscription,
  useSubscriptionLogic,
  useRefreshSubscription,
  usePaymentHistory,
  useCurrentInvoice,
} from "@/hooks/subscription/useSubscription";
import { toast } from "sonner";
import { useAuthUser } from "@/hooks/auth/useAuthUser";

interface PaymentHistoryItem {
  _id: string;
  stripeInvoiceId: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed" | "cancelled";
  description: string;
  invoiceUrl?: string;
  paidAt?: string;
  dueDate?: string;
  createdAt: string;
}

export default function PaymentsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState(
    new Date().getFullYear().toString()
  );

  const { data: subscription, isLoading: subscriptionLoading } =
    useCurrentSubscription();
  const {
    data: paymentData,
    isLoading: paymentsLoading,
    refetch: refetchPayments,
  } = usePaymentHistory();
  const {
    data: currentInvoice,
    isLoading: currentInvoiceLoading,
    refetch: refetchCurrentInvoice,
  } = useCurrentInvoice();
  const { subscriptionEndDate, daysUntilRenewal, remainingPitches } =
    useSubscriptionLogic();
  const { mutate: refreshSubscription, isPending: isRefreshing } =
    useRefreshSubscription();

  const payments = paymentData?.payments || [];
  const { user } = useAuthUser();

  // Filter and search payments
  const filteredPayments = useMemo(() => {
    return payments.filter((payment: PaymentHistoryItem) => {
      const matchesSearch =
        payment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.stripeInvoiceId
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || payment.status === statusFilter;

      const paymentYear = new Date(payment.createdAt).getFullYear().toString();
      const matchesYear = yearFilter === "all" || paymentYear === yearFilter;

      return matchesSearch && matchesStatus && matchesYear;
    });
  }, [payments, searchQuery, statusFilter, yearFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentYearPayments = payments.filter(
      (p: PaymentHistoryItem) =>
        new Date(p.createdAt).getFullYear() === currentYear &&
        p.status === "paid"
    );

    const totalSpent = currentYearPayments.reduce(
      (sum: number, p: PaymentHistoryItem) => sum + p.amount,
      0
    );
    const totalTransactions = currentYearPayments.length;

    return {
      totalSpent,
      totalTransactions,
      lastPayment: payments.find(
        (p: PaymentHistoryItem) => p.status === "paid"
      ),
    };
  }, [payments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "trialing":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20">
            <Zap className="w-3 h-3 mr-1" />
            Trial
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="border-slate-200">
            {status}
          </Badge>
        );
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleDownloadInvoice = (invoiceUrl?: string, invoiceId?: string) => {
    if (invoiceUrl) {
      window.open(invoiceUrl, "_blank");
    } else {
      // Fallback: construct Stripe invoice URL
      const stripeInvoiceUrl = `https://invoice.stripe.com/i/${invoiceId}`;
      window.open(stripeInvoiceUrl, "_blank");
    }
  };

  const handleDownloadCurrentInvoice = async () => {
    try {
      if (!currentInvoice) {
        await refetchCurrentInvoice();
        return;
      }

      if (currentInvoice.hostedInvoiceUrl) {
        window.open(currentInvoice.hostedInvoiceUrl, "_blank");
      } else if (currentInvoice.invoicePdf) {
        window.open(currentInvoice.invoicePdf, "_blank");
      } else {
        toast.error("No invoice URL available");
      }
    } catch (error) {
      console.error("Error downloading current invoice:", error);
      toast.error("Failed to download current invoice");
    }
  };

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-ping opacity-75"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent">
                Payment Center
              </h2>
              <p className="text-muted-foreground mt-1">
                Manage your subscription and view payment history
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refreshSubscription();
                  refetchPayments();
                  refetchCurrentInvoice();
                }}
                disabled={isRefreshing}
                className="border-primary/30 hover:bg-primary/10"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Current Subscription */}
      {subscription ? (
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-950/30">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {subscription.planName} Plan
                    {getStatusBadge(subscription.status)}
                  </CardTitle>
                  <CardDescription>
                    Your active subscription plan and details
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={handleDownloadCurrentInvoice}
                disabled={currentInvoiceLoading || !subscription}
                className="bg-gradient-to-r from-primary to-amber-600 hover:from-amber-600 hover:to-orange-600 text-primary-foreground"
              >
                {currentInvoiceLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Current Invoice
              </Button>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-blue-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Next Billing</span>
                </div>
                <p className="text-lg font-semibold">
                  {subscriptionEndDate
                    ? format(subscriptionEndDate, "MMM dd, yyyy")
                    : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {daysUntilRenewal !== null && daysUntilRenewal > 0
                    ? `${daysUntilRenewal} days remaining`
                    : "Renewal pending"}
                </p>
              </div>

              {user?.role === "Entrepreneur" && (
                <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-purple-200/50">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Plan Benefits</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {remainingPitches} Pitches Left
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {subscription.canAddPitch
                      ? "Active usage"
                      : "Limit reached"}
                  </p>
                </div>
              )}

              <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-green-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <p className="text-lg font-semibold capitalize">
                  {subscription.status}
                </p>
                <p className="text-xs text-muted-foreground">
                  {subscription.cancelAtPeriodEnd
                    ? "Ends on renewal date"
                    : "Auto-renewing"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No Active Subscription
            </h3>
            <p className="text-muted-foreground text-center mb-6">
              Subscribe to a plan to access premium features and start tracking
              your payments.
            </p>
            <Button
              onClick={() => (window.location.href = "/pricing")}
              className="bg-gradient-to-r from-primary to-amber-600 hover:from-amber-600 hover:to-orange-600 text-primary-foreground"
            >
              View Pricing Plans
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Total Spent This Year
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  ${stats.totalSpent.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Total Transactions
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {stats.totalTransactions}
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Last Payment
                </p>
                <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                  {stats.lastPayment
                    ? format(new Date(stats.lastPayment.createdAt), "MMM dd")
                    : "No payments"}
                </p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-full">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Payment History
              </CardTitle>
              <CardDescription>
                View and download all your payment records
              </CardDescription>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search payments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {Array.from(
                    { length: 5 },
                    (_, i) => new Date().getFullYear() - i
                  ).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {paymentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payments found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" || yearFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Your payment history will appear here once you make a payment"}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <TableRow>
                    <TableHead className="font-semibold">Invoice</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment: PaymentHistoryItem) => (
                    <TableRow
                      key={payment._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-500/10 rounded">
                            <Receipt className="h-3 w-3 text-blue-600" />
                          </div>
                          <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            {payment.stripeInvoiceId.slice(-8)}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {payment.stripeInvoiceId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          ${payment.amount.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          {payment.currency.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getPaymentStatusBadge(payment.status)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {format(
                              new Date(payment.createdAt),
                              "MMM dd, yyyy"
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(payment.createdAt), "h:mm a")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDownloadInvoice(
                                payment.invoiceUrl,
                                payment.stripeInvoiceId
                              )
                            }
                            className="border-primary/30 hover:bg-primary/10"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Invoice
                          </Button>
                          {payment.invoiceUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(payment.invoiceUrl, "_blank")
                              }
                              className="hover:bg-secondary/20"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
