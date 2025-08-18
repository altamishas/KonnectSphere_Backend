import Stripe from "stripe";
import { config } from "../config/config";

// Interface for subscription with period dates
interface StripeSubscriptionWithDates {
  status: string;
  current_period_start?: number;
  current_period_end?: number;
  cancel_at_period_end: boolean;
}

// Extended Stripe subscription interface with period dates
// Extended interfaces for Stripe types
export interface ExtendedStripeSubscription
  extends Omit<Stripe.Subscription, "test_clock"> {
  current_period_end: number;
  current_period_start: number;
  test_clock?: string | Stripe.TestHelpers.TestClock | null;
}

export interface ExtendedStripeCustomer
  extends Omit<Stripe.Customer, "test_clock"> {
  test_clock?: string | Stripe.TestHelpers.TestClock | null;
}

// Removed ExtendedStripeTestClock as test clocks are no longer used

// Validate required environment variables
if (!config.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

if (!config.FRONTEND_URL) {
  throw new Error("FRONTEND_URL is required");
}

// Initialize Stripe
const stripe = new Stripe(config.STRIPE_SECRET_KEY);

// Validate Stripe key in production
if (
  config.STRIPE_SECRET_KEY.includes("sk_test") &&
  config.NODE_ENV === "production"
) {
  throw new Error(
    "You are using the Stripe test secret key in production. Please use the live secret key."
  );
}

type CustomerCreateParamsWithTestClock = Stripe.CustomerCreateParams;

interface CreateCustomerData {
  name?: string;
  email: string;
  metadata?: Record<string, string>;
}

interface CreateProductData {
  name: string;
  metadata?: Record<string, string>;
}

interface CreatePriceData {
  currency?: string;
  unitAmount: number;
  interval: "month" | "year";
  productId: string;
  metadata?: Record<string, string>;
}

interface CheckoutSessionData {
  customerId: string;
  priceStripeId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

interface SubscriptionData {
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

class BillingService {
  private stripe: Stripe;

  constructor() {
    this.stripe = stripe;
  }

  // Customer management
  async createCustomer({
    name = "",
    email,
    metadata = {},
  }: CreateCustomerData): Promise<string> {
    try {
      const params: CustomerCreateParamsWithTestClock = {
        name,
        email,
        metadata,
      };
      const customer = await this.stripe.customers.create(params);
      return customer.id;
    } catch (error) {
      console.error("Error creating customer:", error);
      throw new Error("Failed to create customer");
    }
  }

  // Product management
  async createProduct({
    name,
    metadata = {},
  }: CreateProductData): Promise<string> {
    try {
      const product = await this.stripe.products.create({
        name,
        metadata,
      });
      return product.id;
    } catch (error) {
      console.error("Error creating product:", error);
      throw new Error("Failed to create product");
    }
  }

  // Price management
  async createPrice({
    currency = "usd",
    unitAmount,
    interval,
    productId,
    metadata = {},
  }: CreatePriceData): Promise<string> {
    try {
      const price = await this.stripe.prices.create({
        currency,
        unit_amount: unitAmount,
        recurring: { interval },
        product: productId,
        metadata,
      });
      return price.id;
    } catch (error) {
      console.error("Error creating price:", error);
      throw new Error("Failed to create price");
    }
  }

  // Checkout session management
  async createCheckoutSession({
    customerId,
    priceStripeId,
    successUrl,
    cancelUrl,
    metadata = {},
  }: CheckoutSessionData): Promise<Stripe.Checkout.Session> {
    try {
      if (!successUrl.includes("{CHECKOUT_SESSION_ID}")) {
        successUrl = `${successUrl}?session_id={CHECKOUT_SESSION_ID}`;
      }

      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        line_items: [
          {
            price: priceStripeId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        metadata,
        billing_address_collection: "required",
        allow_promotion_codes: true,
        subscription_data: {
          metadata,
        },
      });

      return session;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw new Error("Failed to create checkout session");
    }
  }

  async getCheckoutSession(
    sessionId: string
  ): Promise<Stripe.Checkout.Session | null> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription", "customer"],
      });
      return session;
    } catch (error) {
      console.error("Error retrieving checkout session:", error);
      return null;
    }
  }

  // Subscription management
  async getSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(
        subscriptionId
      );
      return subscription;
    } catch (error) {
      console.error("Error retrieving subscription:", error);
      return null;
    }
  }

  async updateSubscription(
    subscriptionId: string,
    updates: Partial<Stripe.SubscriptionUpdateParams>
  ): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await this.stripe.subscriptions.update(
        subscriptionId,
        updates
      );
      return subscription;
    } catch (error) {
      console.error("Error updating subscription:", error);
      return null;
    }
  }

  async cancelSubscription(
    subscriptionId: string,
    reason = "",
    feedback = "",
    cancelAtPeriodEnd = false
  ): Promise<Stripe.Subscription | null> {
    try {
      let subscription: Stripe.Subscription;

      if (cancelAtPeriodEnd) {
        subscription = await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: cancelAtPeriodEnd,
          cancellation_details: {
            comment: reason,
            feedback:
              feedback as Stripe.SubscriptionUpdateParams.CancellationDetails.Feedback,
          },
        });
      } else {
        subscription = await this.stripe.subscriptions.cancel(subscriptionId, {
          cancellation_details: {
            comment: reason,
            feedback:
              feedback as Stripe.SubscriptionCancelParams.CancellationDetails.Feedback,
          },
        });
      }

      return subscription;
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      return null;
    }
  }

  async getCustomerActiveSubscriptions(
    customerId: string
  ): Promise<Stripe.Subscription[]> {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: "active",
      });
      return subscriptions.data;
    } catch (error) {
      console.error("Error retrieving customer subscriptions:", error);
      return [];
    }
  }

  // Subscription upgrade/downgrade
  async changeSubscriptionPlan(
    subscriptionId: string,
    newPriceId: string,
    prorationBehavior:
      | "create_prorations"
      | "none"
      | "always_invoice" = "create_prorations"
  ): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(
        subscriptionId
      );

      const updatedSubscription = await this.stripe.subscriptions.update(
        subscriptionId,
        {
          items: [
            {
              id: subscription.items.data[0].id,
              price: newPriceId,
            },
          ],
          proration_behavior: prorationBehavior,
        }
      );

      return updatedSubscription;
    } catch (error) {
      console.error("Error changing subscription plan:", error);
      return null;
    }
  }

  // Invoice management
  async getUpcomingInvoice(customerId: string): Promise<Stripe.Invoice | null> {
    try {
      console.log("🔍 Getting most recent invoice for customer:", customerId);

      // First try to get the most recent paid invoice
      const paidInvoices = await this.stripe.invoices.list({
        customer: customerId,
        limit: 1,
        status: "paid",
      });

      if (paidInvoices.data.length > 0) {
        console.log("✅ Found recent paid invoice:", paidInvoices.data[0].id);
        return paidInvoices.data[0];
      }

      console.log("ℹ️ No paid invoices found, trying any recent invoice");

      // If no paid invoices, try to get any recent invoice
      const allInvoices = await this.stripe.invoices.list({
        customer: customerId,
        limit: 1,
      });

      if (allInvoices.data.length > 0) {
        console.log("✅ Found recent invoice:", allInvoices.data[0].id);
        return allInvoices.data[0];
      }

      console.log("❌ No invoices found for customer");
      return null;
    } catch (error) {
      console.error("❌ Error retrieving recent invoice:", error);
      return null;
    }
  }

  async getInvoices(customerId: string, limit = 10): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit,
      });
      return invoices.data;
    } catch (error) {
      console.error("Error retrieving invoices:", error);
      return [];
    }
  }

  async getInvoiceById(invoiceId: string): Promise<Stripe.Invoice | null> {
    try {
      const invoice = await this.stripe.invoices.retrieve(invoiceId);
      return invoice;
    } catch (error) {
      console.error("Error retrieving invoice by ID:", error);
      return null;
    }
  }

  // Utility methods
  serializeSubscriptionData(
    subscription: Stripe.Subscription
  ): SubscriptionData {
    // Handle dates safely - Stripe may return null for canceled subscriptions
    const subscriptionData = subscription as StripeSubscriptionWithDates;
    const currentPeriodStart = subscriptionData.current_period_start
      ? new Date(subscriptionData.current_period_start * 1000)
      : new Date();

    let currentPeriodEnd = subscriptionData.current_period_end
      ? new Date(subscriptionData.current_period_end * 1000)
      : null;

    // If end is missing or invalid (<= start), derive from subscription interval
    if (
      !currentPeriodEnd ||
      currentPeriodEnd.getTime() <= currentPeriodStart.getTime()
    ) {
      const derived = new Date(currentPeriodStart);
      // Try to read interval from the subscription's first item
      const firstItem =
        (subscription.items &&
          subscription.items.data &&
          subscription.items.data[0]) ||
        undefined;
      const recurringInterval =
        (firstItem?.price?.recurring?.interval as
          | "month"
          | "year"
          | undefined) || "month";
      if (recurringInterval === "year") {
        derived.setFullYear(derived.getFullYear() + 1);
      } else {
        derived.setMonth(derived.getMonth() + 1);
      }
      currentPeriodEnd = derived;
    }

    return {
      status: subscription.status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    };
  }

  async getCheckoutCustomerPlan(sessionId: string) {
    try {
      console.log("🔍 Getting checkout session:", sessionId);
      const session = await this.getCheckoutSession(sessionId);

      if (!session || !session.subscription || !session.customer) {
        console.log("❌ Invalid checkout session data:", {
          hasSession: !!session,
          hasSubscription: !!session?.subscription,
          hasCustomer: !!session?.customer,
        });
        throw new Error("Invalid checkout session");
      }

      console.log("✅ Checkout session retrieved successfully");
      console.log("📊 Session subscription type:", typeof session.subscription);

      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer.id;

      // Handle both expanded subscription object and subscription ID string
      let subscription: Stripe.Subscription;
      if (typeof session.subscription === "string") {
        console.log("🔍 Getting subscription by ID:", session.subscription);
        const retrievedSubscription = await this.getSubscription(
          session.subscription
        );
        if (!retrievedSubscription) {
          throw new Error("Subscription not found");
        }
        subscription = retrievedSubscription;
      } else {
        console.log("✅ Using expanded subscription object");
        subscription = session.subscription as Stripe.Subscription;
      }

      console.log("📋 Subscription details:", {
        id: subscription.id,
        status: subscription.status,
        priceId: subscription.items.data[0]?.price.id,
      });

      const subscriptionData = this.serializeSubscriptionData(subscription);
      const priceId = subscription.items.data[0]?.price.id;

      return {
        customerId,
        priceId,
        subscriptionId: subscription.id,
        ...subscriptionData,
      };
    } catch (error) {
      console.error("❌ Error getting checkout customer plan:", error);
      throw error;
    }
  }

  // Webhook signature verification
  constructEvent(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }

  // Preview invoice for subscription changes
  async previewSubscriptionChange(
    subscriptionId: string,
    newPriceId: string
  ): Promise<Stripe.Invoice | null> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(
        subscriptionId
      );

      // Use type assertion to bypass TypeScript limitations
      const stripeInvoices = this.stripe
        .invoices as typeof this.stripe.invoices & {
        upcoming: (params: {
          customer: string;
          subscription?: string;
          subscription_items?: Array<{ id: string; price: string }>;
        }) => Promise<Stripe.Invoice>;
      };

      const invoice = await stripeInvoices.upcoming({
        customer: subscription.customer as string,
        subscription: subscriptionId,
        subscription_items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
      });

      return invoice;
    } catch (error) {
      console.error("Error previewing subscription change:", error);
      return null;
    }
  }

  // Verify if a price exists in Stripe
  async verifyPrice(priceId: string): Promise<boolean> {
    try {
      const price = await this.stripe.prices.retrieve(priceId);
      return price.active !== false;
    } catch (error) {
      if (
        (error as Stripe.errors.StripeError).type ===
        "StripeInvalidRequestError"
      ) {
        return false;
      }
      throw error;
    }
  }

  // Verify if a product exists in Stripe
  async verifyProduct(productId: string): Promise<boolean> {
    try {
      const product = await this.stripe.products.retrieve(productId);
      return product.active !== false;
    } catch (error) {
      if (
        (error as Stripe.errors.StripeError).type ===
        "StripeInvalidRequestError"
      ) {
        return false;
      }
      throw error;
    }
  }

  // Removed test clock helper methods; use Stripe CLI to simulate events during development

  // ====== ENHANCED RECURRING PAYMENT METHODS ======

  /**
   * Get detailed payment history for a customer from Stripe
   */
  async getCustomerPaymentHistory(
    customerId: string,
    limit = 20
  ): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit,
        expand: ["data.payment_intent"],
      });
      return invoices.data;
    } catch (error) {
      console.error("Error retrieving customer payment history:", error);
      return [];
    }
  }

  /**
   * Retry a failed payment for a specific invoice
   */
  async retryFailedPayment(invoiceId: string): Promise<Stripe.Invoice | null> {
    try {
      // First, retrieve the invoice to check its status
      const invoice = await this.stripe.invoices.retrieve(invoiceId);

      if (invoice.status === "open" || invoice.status === "uncollectible") {
        // Attempt to pay the invoice
        const paidInvoice = await this.stripe.invoices.pay(invoiceId);
        return paidInvoice;
      }

      return invoice;
    } catch (error) {
      console.error("Error retrying failed payment:", error);
      return null;
    }
  }

  /**
   * Get subscription payment method information
   */
  async getSubscriptionPaymentMethod(
    subscriptionId: string
  ): Promise<Stripe.PaymentMethod | null> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(
        subscriptionId,
        {
          expand: ["default_payment_method"],
        }
      );

      return (
        (subscription.default_payment_method as Stripe.PaymentMethod) || null
      );
    } catch (error) {
      console.error("Error retrieving subscription payment method:", error);
      return null;
    }
  }

  /**
   * Update subscription payment method
   */
  async updateSubscriptionPaymentMethod(
    subscriptionId: string,
    paymentMethodId: string
  ): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await this.stripe.subscriptions.update(
        subscriptionId,
        {
          default_payment_method: paymentMethodId,
        }
      );
      return subscription;
    } catch (error) {
      console.error("Error updating subscription payment method:", error);
      return null;
    }
  }

  /**
   * Get failed invoices for a customer that can be retried
   */
  async getFailedInvoicesForCustomer(
    customerId: string
  ): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        status: "open",
        limit: 10,
      });

      // Filter for invoices that are actually failed/past due
      return invoices.data.filter(
        (invoice) => invoice.attempt_count > 0 && invoice.amount_due > 0
      );
    } catch (error) {
      console.error("Error retrieving failed invoices:", error);
      return [];
    }
  }

  /**
   * Check if a subscription is in a grace period
   */
  async isSubscriptionInGracePeriod(subscriptionId: string): Promise<boolean> {
    try {
      const subscription: Stripe.Subscription =
        await this.stripe.subscriptions.retrieve(subscriptionId);

      // Check if subscription is past due but still active
      if (subscription.status === "past_due") {
        const extendedSubscription = subscription as ExtendedStripeSubscription;
        const currentPeriodEnd = extendedSubscription.current_period_end;
        if (currentPeriodEnd) {
          const daysSincePeriodEnd = Math.floor(
            (Date.now() - currentPeriodEnd * 1000) / (1000 * 60 * 60 * 24)
          );

          // Stripe typically gives a grace period of up to 23 days
          return daysSincePeriodEnd <= 23;
        }
      }

      return false;
    } catch (error) {
      console.error("Error checking subscription grace period:", error);
      return false;
    }
  }

  /**
   * Get subscription retry schedule information
   */
  async getSubscriptionRetryInfo(subscriptionId: string): Promise<{
    nextRetryDate: Date | null;
    retryCount: number;
    maxRetries: number;
  }> {
    try {
      const subscription: Stripe.Subscription =
        await this.stripe.subscriptions.retrieve(subscriptionId);

      // Stripe's default retry schedule: immediate, 3 days, 5 days, 7 days
      const retrySchedule = [0, 3, 5, 7]; // days after initial failure

      if (subscription.status === "past_due") {
        const extendedSubscription = subscription as ExtendedStripeSubscription;
        const currentPeriodEnd = extendedSubscription.current_period_end;
        if (currentPeriodEnd) {
          const daysSincePeriodEnd = Math.floor(
            (Date.now() - currentPeriodEnd * 1000) / (1000 * 60 * 60 * 24)
          );

          let retryCount = 0;
          let nextRetryDate: Date | null = null;

          // Determine current retry count and next retry date
          for (let i = 0; i < retrySchedule.length; i++) {
            if (daysSincePeriodEnd >= retrySchedule[i]) {
              retryCount = i + 1;
            } else {
              const nextRetryDays = retrySchedule[i];
              nextRetryDate = new Date(currentPeriodEnd * 1000);
              nextRetryDate.setDate(nextRetryDate.getDate() + nextRetryDays);
              break;
            }
          }

          return {
            nextRetryDate,
            retryCount,
            maxRetries: retrySchedule.length,
          };
        }
      }

      return {
        nextRetryDate: null,
        retryCount: 0,
        maxRetries: retrySchedule.length,
      };
    } catch (error) {
      console.error("Error getting subscription retry info:", error);
      return {
        nextRetryDate: null,
        retryCount: 0,
        maxRetries: 4,
      };
    }
  }

  /**
   * Force sync subscription data from Stripe
   */
  async forceSubscriptionSync(subscriptionId: string): Promise<{
    subscription: Stripe.Subscription | null;
    latestInvoice: Stripe.Invoice | null;
    paymentMethod: Stripe.PaymentMethod | null;
  }> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(
        subscriptionId,
        {
          expand: ["latest_invoice", "default_payment_method"],
        }
      );

      const latestInvoice =
        (subscription.latest_invoice as Stripe.Invoice) || null;
      const paymentMethod =
        (subscription.default_payment_method as Stripe.PaymentMethod) || null;

      return {
        subscription,
        latestInvoice,
        paymentMethod,
      };
    } catch (error) {
      console.error("Error force syncing subscription:", error);
      return {
        subscription: null,
        latestInvoice: null,
        paymentMethod: null,
      };
    }
  }

  /**
   * Link customer to test clock
   */
  // Removed linkCustomerToTestClock; no longer needed

  /**
   * Get customer details
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer as Stripe.Customer;
    } catch (error) {
      console.error("Error retrieving customer:", error);
      return null;
    }
  }
}

export default new BillingService();
