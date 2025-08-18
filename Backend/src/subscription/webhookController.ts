import { Request, Response } from "express";
import mongoose from "mongoose";
import billingService from "../utils/billingService";
import { config } from "../config/config";
import {
  UserSubscription,
  PaymentHistory,
  SubscriptionPrice,
  SubscriptionStatus,
  ISubscription,
  ISubscriptionPrice,
} from "./subscriptionModel";
import User from "../user/userModel";
import emailService from "../utils/emailService";

// Stripe webhook object interfaces
interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  trial_end?: number;
  items: {
    data: Array<{
      price: {
        id: string;
      };
    }>;
  };
}

interface StripeInvoice {
  id: string;
  subscription: string;
  amount_paid: number;
  amount_due: number;
  currency: string;
  description?: string;
  hosted_invoice_url?: string;
  payment_intent?: string;
  due_date: number;
  period_end: number;
  next_payment_attempt?: number;
  attempt_count?: number;
  status_transitions: {
    paid_at: number;
  };
}

interface PopulatedUser {
  _id: string;
  email: string;
  fullName: string;
}

interface PopulatedUserSubscription {
  _id: string;
  user: PopulatedUser;
  subscription: ISubscription | mongoose.Types.ObjectId;
  subscriptionPrice?: ISubscriptionPrice | mongoose.Types.ObjectId;
  stripeId: string;
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  active: boolean;
  userCancelled: boolean;
  save(): Promise<void>;
}

export const handleStripeWebhook = async (req: Request, res: Response) => {
  // Enhanced logging for ngrok testing
  console.log("🔔 Webhook received!");
  console.log("📡 Host:", req.get("Host"));
  console.log("🔗 User-Agent:", req.get("User-Agent"));
  console.log("🌐 X-Forwarded-For:", req.get("X-Forwarded-For"));
  console.log("🔒 X-Forwarded-Proto:", req.get("X-Forwarded-Proto"));
  console.log(
    "🔑 STRIPE_WEBHOOK_SECRET loaded:",
    !!config.STRIPE_WEBHOOK_SECRET
  );
  console.log(
    "🔑 Secret preview:",
    config.STRIPE_WEBHOOK_SECRET?.substring(0, 15) + "..."
  );

  // Check if request is coming through ngrok
  const host = req.get("Host");
  if (host?.includes("ngrok.io")) {
    console.log("🚧 Request received via ngrok tunnel:", host);
  } else if (host?.includes("localhost")) {
    console.log("🏠 Direct localhost request:", host);
  } else {
    console.log("🌍 Production request:", host);
  }

  const sig = req.headers["stripe-signature"] as string;

  if (!sig || !config.STRIPE_WEBHOOK_SECRET) {
    console.error("❌ No signature or webhook secret");
    res.status(400).send("Webhook signature required");
    return;
  }

  console.log("🔐 Stripe signature found:", sig.substring(0, 20) + "...");

  let event;

  try {
    event = billingService.constructEvent(
      req.body,
      sig,
      config.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Webhook signature verification failed:", error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
    return;
  }

  console.log("✅ Webhook signature verified successfully");
  console.log("📝 Processing event type:", event.type);
  console.log("🆔 Event ID:", event.id);

  try {
    switch (event.type) {
      case "customer.subscription.created":
        console.log("🎯 Processing: customer.subscription.created");
        await handleSubscriptionCreated(
          event.data.object as unknown as StripeSubscription
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as unknown as StripeSubscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as unknown as StripeSubscription
        );
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as unknown as StripeInvoice
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          event.data.object as unknown as StripeInvoice
        );
        break;

      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(
          event.data.object as unknown as StripeSubscription
        );
        break;

      case "invoice.upcoming":
        await handleUpcomingInvoice(
          event.data.object as unknown as StripeInvoice
        );
        break;

      case "invoice.payment_action_required":
        await handleInvoicePaymentActionRequired(
          event.data.object as unknown as StripeInvoice
        );
        break;

      // Note: customer.subscription.past_due is not a real Stripe event
      // Past due status is handled through subscription.updated events

      case "invoice.finalized":
        await handleInvoiceFinalized(
          event.data.object as unknown as StripeInvoice
        );
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    console.log("🎉 Webhook processed successfully!");
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("💥 Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

async function handleSubscriptionCreated(subscription: StripeSubscription) {
  console.log("Subscription created:", subscription.id);

  try {
    // Find user by stripe customer ID
    const user = await User.findOne({
      stripeCustomerId: subscription.customer,
    });
    if (!user) {
      console.error("User not found for customer:", subscription.customer);
      return;
    }

    // Find subscription price by stripe price ID
    const priceId = subscription.items.data[0]?.price.id;
    const subscriptionPrice = await SubscriptionPrice.findOne({
      stripeId: priceId,
    }).populate("subscription");

    if (!subscriptionPrice) {
      console.error("Subscription price not found for:", priceId);
      return;
    }

    // Create or update user subscription
    let userSubscription = await UserSubscription.findOne({ user: user._id });

    if (!userSubscription) {
      userSubscription = new UserSubscription({
        user: user._id,
        subscription: subscriptionPrice.subscription._id,
        subscriptionPrice: subscriptionPrice._id,
      });
    } else {
      // **CRITICAL FIX**: Update subscription and price references for plan changes
      console.log(
        "🔄 [Webhook] Updating subscription reference from old to new:",
        {
          oldSubscription: userSubscription.subscription,
          newSubscription: subscriptionPrice.subscription._id,
          oldPrice: userSubscription.subscriptionPrice,
          newPrice: subscriptionPrice._id,
        }
      );
      userSubscription.subscription = subscriptionPrice.subscription._id;
      userSubscription.subscriptionPrice = subscriptionPrice._id;
    }

    // Update subscription details with safe period handling
    userSubscription.stripeId = subscription.id;
    userSubscription.stripeCustomerId = subscription.customer;
    userSubscription.status =
      subscription.status === "canceled"
        ? SubscriptionStatus.CANCELLED
        : (subscription.status as SubscriptionStatus);

    const startDate = new Date(subscription.current_period_start * 1000);
    let endDate = new Date(subscription.current_period_end * 1000);

    if (!endDate || endDate.getTime() <= startDate.getTime()) {
      const derivedEnd = new Date(startDate);
      const interval = subscriptionPrice.interval;
      if (interval === "year") {
        derivedEnd.setFullYear(derivedEnd.getFullYear() + 1);
      } else {
        derivedEnd.setMonth(derivedEnd.getMonth() + 1);
      }
      endDate = derivedEnd;
      console.log("🛠️ [Webhook Created] Derived period end date:", {
        startDate,
        endDate,
        interval,
      });
    }

    userSubscription.currentPeriodStart = startDate;
    userSubscription.currentPeriodEnd = endDate;
    userSubscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;
    userSubscription.active = true;
    userSubscription.billingCycleAnchor = startDate;

    await userSubscription.save();

    // Update user's subscription plan
    const subscriptionData = subscriptionPrice.subscription as { name: string };
    await User.findByIdAndUpdate(user._id, {
      subscriptionPlan: subscriptionData.name,
    });

    console.log("User subscription created/updated for user:", user._id);
  } catch (error) {
    console.error("Error handling subscription created:", error);
  }
}

async function handleSubscriptionUpdated(subscription: StripeSubscription) {
  console.log("Subscription updated:", subscription.id);

  try {
    const userSubscription = await UserSubscription.findOne({
      stripeId: subscription.id,
    });

    if (!userSubscription) {
      console.error("User subscription not found for:", subscription.id);
      return;
    }

    // Check if the subscription price/plan has changed
    const priceId = subscription.items.data[0]?.price.id;
    if (priceId) {
      const subscriptionPrice = await SubscriptionPrice.findOne({
        stripeId: priceId,
      }).populate("subscription");

      if (subscriptionPrice) {
        // Update subscription and price references if they've changed
        if (
          userSubscription.subscriptionPrice.toString() !==
          subscriptionPrice._id.toString()
        ) {
          console.log(
            "🔄 [Webhook Update] Plan changed, updating subscription reference:",
            {
              oldSubscription: userSubscription.subscription,
              newSubscription: subscriptionPrice.subscription._id,
              oldPrice: userSubscription.subscriptionPrice,
              newPrice: subscriptionPrice._id,
            }
          );

          userSubscription.subscription = subscriptionPrice.subscription._id;
          userSubscription.subscriptionPrice = subscriptionPrice._id;

          // Update user's subscription plan
          const subscriptionData = subscriptionPrice.subscription as {
            name: string;
          };
          await User.findByIdAndUpdate(userSubscription.user, {
            subscriptionPlan: subscriptionData.name,
          });
        }
      }
    }

    // Update subscription details - handle Stripe's "canceled" vs our "cancelled"
    userSubscription.status =
      subscription.status === "canceled"
        ? SubscriptionStatus.CANCELLED
        : (subscription.status as SubscriptionStatus);

    const startDate = new Date(subscription.current_period_start * 1000);
    let endDate = new Date(subscription.current_period_end * 1000);

    if (!endDate || endDate.getTime() <= startDate.getTime()) {
      // Determine interval from current price on subscription
      let interval: "month" | "year" = "month";
      const priceId = subscription.items.data[0]?.price.id;
      if (priceId) {
        const subPrice = await SubscriptionPrice.findOne({ stripeId: priceId });
        if (subPrice) {
          interval =
            (subPrice.interval as unknown as "month" | "year") || "month";
        }
      }

      const derivedEnd = new Date(startDate);
      if (interval === "year") {
        derivedEnd.setFullYear(derivedEnd.getFullYear() + 1);
      } else {
        derivedEnd.setMonth(derivedEnd.getMonth() + 1);
      }
      endDate = derivedEnd;
      console.log("🛠️ [Webhook Updated] Derived period end date:", {
        startDate,
        endDate,
        interval,
      });
    }

    userSubscription.currentPeriodStart = startDate;
    userSubscription.currentPeriodEnd = endDate;
    userSubscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;

    // If now past_due, mark inactive
    if (userSubscription.status === SubscriptionStatus.PAST_DUE) {
      userSubscription.active = false;
    }

    await userSubscription.save();

    // If subscription was cancelled, send cancellation email notification
    if (subscription.cancel_at_period_end) {
      const user = await User.findById(userSubscription.user);
      if (user) {
        try {
          // Get subscription plan name for the email
          const subscriptionData = await UserSubscription.findById(
            userSubscription._id
          ).populate("subscription");
          const planName =
            (subscriptionData?.subscription as ISubscription)?.name ||
            "Subscription";

          await emailService.sendSubscriptionCancellationConfirmation(
            user.email,
            user.fullName,
            planName,
            new Date(subscription.current_period_end * 1000),
            false // Not immediate cancellation
          );
        } catch (emailError) {
          console.error("Error sending cancellation email:", emailError);
        }
      }
    }

    console.log("User subscription updated for:", userSubscription.user);
  } catch (error) {
    console.error("Error handling subscription updated:", error);
  }
}

async function handleSubscriptionDeleted(subscription: StripeSubscription) {
  console.log("Subscription deleted:", subscription.id);

  try {
    const userSubscription = await UserSubscription.findOne({
      stripeId: subscription.id,
    });

    if (!userSubscription) {
      console.error("User subscription not found for:", subscription.id);
      return;
    }

    // Update subscription status - handle both "canceled" and "cancelled"
    userSubscription.status = SubscriptionStatus.CANCELLED;
    userSubscription.active = false;
    userSubscription.userCancelled = true;

    await userSubscription.save();

    // Update user's subscription plan to Basic
    await User.findByIdAndUpdate(userSubscription.user, {
      subscriptionPlan: "Basic",
    });

    console.log("User subscription cancelled for:", userSubscription.user);
  } catch (error) {
    console.error("Error handling subscription deleted:", error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: StripeInvoice) {
  console.log("Invoice payment succeeded:", invoice.id);

  try {
    // Find user subscription
    const userSubscription = (await UserSubscription.findOne({
      stripeId: invoice.subscription,
    }).populate("user subscription")) as PopulatedUserSubscription | null;

    if (!userSubscription) {
      console.error("User subscription not found for invoice:", invoice.id);
      return;
    }

    // Check if this is a recurring payment (not the first payment)
    const existingPayments = await PaymentHistory.countDocuments({
      userSubscription: userSubscription._id,
      status: "paid",
    });
    const isRecurringPayment = existingPayments > 0;

    // Avoid duplicates if initial payment history already exists
    const existingPaid = await PaymentHistory.findOne({
      stripeInvoiceId: invoice.id,
      status: "paid",
    });

    if (!existingPaid) {
      // Create payment history record
      const paymentHistory = new PaymentHistory({
        user: userSubscription.user._id,
        userSubscription: userSubscription._id,
        stripeInvoiceId: invoice.id,
        stripePaymentIntentId: invoice.payment_intent,
        amount: invoice.amount_paid / 100, // Convert from cents
        currency: invoice.currency,
        status: "paid",
        description:
          invoice.description ||
          (isRecurringPayment
            ? "Recurring subscription payment"
            : "Initial subscription payment"),
        invoiceUrl: invoice.hosted_invoice_url,
        paidAt: new Date(invoice.status_transitions.paid_at * 1000),
        dueDate: new Date(invoice.due_date * 1000),
        paymentType: isRecurringPayment ? "recurring" : "initial",
        retryCount: 0,
      });

      await paymentHistory.save();
    } else {
      console.log("ℹ️ Skipping duplicate paid invoice record:", invoice.id);
    }

    // Ensure local subscription is synced and active after payment success
    try {
      const stripeSub = await billingService.getSubscription(
        invoice.subscription
      );
      if (stripeSub) {
        const subWithDates = stripeSub as unknown as {
          current_period_start?: number;
          current_period_end?: number;
          cancel_at_period_end?: boolean;
        };
        if (subWithDates.current_period_start) {
          userSubscription.currentPeriodStart = new Date(
            subWithDates.current_period_start * 1000
          );
        }
        if (subWithDates.current_period_end) {
          userSubscription.currentPeriodEnd = new Date(
            subWithDates.current_period_end * 1000
          );
        }
        userSubscription.cancelAtPeriodEnd =
          !!subWithDates.cancel_at_period_end;
        userSubscription.status = SubscriptionStatus.ACTIVE;
        userSubscription.active = true;
        await userSubscription.save();
      }
    } catch (syncErr) {
      console.error(
        "⚠️ Failed to sync subscription after payment success:",
        syncErr
      );
      // Fallback: at least mark as active
      if (userSubscription.status === SubscriptionStatus.PAST_DUE) {
        userSubscription.status = SubscriptionStatus.ACTIVE;
        userSubscription.active = true;
        await userSubscription.save();
      }
    }

    // Send appropriate email based on payment type
    const user = userSubscription.user;
    if (user && user.email) {
      try {
        // Get subscription and price details
        const fullUserSubscription = await UserSubscription.findById(
          userSubscription._id
        )
          .populate("subscription")
          .populate("subscriptionPrice");

        const subscription =
          fullUserSubscription?.subscription as ISubscription;
        const subscriptionPrice =
          fullUserSubscription?.subscriptionPrice as ISubscriptionPrice;
        const planName = subscription?.name || "Subscription";

        // Prepare receipt data
        const receiptData = {
          invoiceId: invoice.id,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          planName: planName,
          billingPeriod:
            subscriptionPrice?.interval === "year" ? "Annual" : "Monthly",
          paymentDate: new Date(invoice.status_transitions.paid_at * 1000),
          nextBillingDate: userSubscription.currentPeriodEnd,
          invoiceUrl: invoice.hosted_invoice_url,
        };

        if (isRecurringPayment) {
          // Send recurring payment success email with receipt
          console.log("📧 Sending recurring payment success email");
          await emailService.sendRecurringPaymentSuccessNotification(
            user.email,
            user.fullName,
            receiptData
          );
        } else {
          // Send initial subscription confirmation with plan-specific email
          console.log("Sending initial subscription confirmation email");
          if (planName.includes("Basic") && planName.includes("Entrepreneur")) {
            await emailService.sendEntrepreneurBasicPlanConfirmation(
              user.email,
              user.fullName,
              receiptData
            );
          } else if (planName.includes("Premium")) {
            await emailService.sendEntrepreneurPremiumPlanConfirmation(
              user.email,
              user.fullName,
              receiptData
            );
          } else if (planName.includes("Investor")) {
            await emailService.sendInvestorAnnualPlanConfirmation(
              user.email,
              user.fullName,
              receiptData
            );
          } else {
            await emailService.sendSubscriptionConfirmation(
              user.email,
              user.fullName
            );
          }
        }
      } catch (emailError) {
        console.error("Error sending payment confirmation email:", emailError);
      }
    }

    console.log(
      `${
        isRecurringPayment ? "Recurring" : "Initial"
      } payment history created for user:`,
      userSubscription.user._id
    );
  } catch (error) {
    console.error("Error handling invoice payment succeeded:", error);
  }
}

async function handleInvoicePaymentFailed(invoice: StripeInvoice) {
  console.log("💳❌ Invoice payment failed:", invoice.id);

  try {
    // Find user subscription with full population
    const userSubscription = (await UserSubscription.findOne({
      stripeId: invoice.subscription,
    }).populate(
      "user subscription subscriptionPrice"
    )) as PopulatedUserSubscription | null;

    if (!userSubscription) {
      console.error("❌ User subscription not found for invoice:", invoice.id);
      return;
    }

    // Check if this payment failure record already exists to avoid duplicates
    const existingPaymentRecord = await PaymentHistory.findOne({
      stripeInvoiceId: invoice.id,
      status: "failed",
    });

    if (!existingPaymentRecord) {
      // Create payment history record for the failed payment
      const paymentHistory = new PaymentHistory({
        user: userSubscription.user._id,
        userSubscription: userSubscription._id,
        stripeInvoiceId: invoice.id,
        stripePaymentIntentId: invoice.payment_intent,
        amount: invoice.amount_due / 100, // Convert from cents
        currency: invoice.currency,
        status: "failed",
        description:
          invoice.description || "Recurring subscription payment failed",
        invoiceUrl: invoice.hosted_invoice_url,
        dueDate: invoice.due_date
          ? new Date(invoice.due_date * 1000)
          : undefined,
        failedAt: new Date(),
        lastRetryAt: invoice.next_payment_attempt
          ? new Date(invoice.next_payment_attempt * 1000)
          : new Date(),
        retryCount:
          typeof invoice.attempt_count === "number" ? invoice.attempt_count : 1,
      });

      await paymentHistory.save();
      console.log("💾 Payment failure record created:", paymentHistory._id);
    } else {
      console.log(
        "ℹ️ Payment failure record already exists for invoice:",
        invoice.id
      );
    }

    // Update subscription status to past_due and deactivate access
    if (userSubscription.status !== SubscriptionStatus.PAST_DUE) {
      userSubscription.status = SubscriptionStatus.PAST_DUE;
      userSubscription.active = false;
      await userSubscription.save();
      console.log(
        "🔄 Subscription status updated to past_due and access disabled"
      );
    }

    // Get subscription and plan details for email
    const subscription = userSubscription.subscription as ISubscription;
    const planName = subscription?.name || "Subscription";
    const user = userSubscription.user;

    // Send payment failure notification email
    if (user && user.email) {
      try {
        // Calculate retry date (Stripe typically retries after 3 days, then 5 days, then 7 days)
        const nextRetryDate = new Date();
        nextRetryDate.setDate(nextRetryDate.getDate() + 3);

        // Get invoice details for email
        const invoiceDetails = {
          invoiceId: invoice.id,
          amount: invoice.amount_due / 100,
          currency: invoice.currency || "usd",
          dueDate: new Date(invoice.due_date * 1000),
          planName,
          nextRetryDate,
          invoiceUrl: invoice.hosted_invoice_url,
        };

        await emailService.sendPaymentFailureNotification(
          user.email,
          user.fullName,
          invoiceDetails
        );

        console.log("📧 Payment failure email sent to:", user.email);
      } catch (emailError) {
        console.error("❌ Error sending payment failure email:", emailError);
      }
    }

    console.log(
      "✅ Payment failure processed for user:",
      userSubscription.user._id
    );
  } catch (error) {
    console.error("❌ Error handling invoice payment failed:", error);
  }
}

async function handleTrialWillEnd(subscription: StripeSubscription) {
  console.log("Trial will end:", subscription.id);

  try {
    const userSubscription = (await UserSubscription.findOne({
      stripeId: subscription.id,
    }).populate("user")) as PopulatedUserSubscription | null;

    if (!userSubscription) {
      console.error("User subscription not found for:", subscription.id);
      return;
    }

    // Send trial ending notification
    const user = userSubscription.user;
    if (user && user.email && subscription.trial_end) {
      try {
        const trialEndDate = new Date(
          subscription.trial_end * 1000
        ).toLocaleDateString();
        await emailService.sendSubscriptionRenewalReminder(
          user.email,
          user.fullName,
          trialEndDate
        );
      } catch (emailError) {
        console.error("Error sending trial ending email:", emailError);
      }
    }

    console.log(
      "Trial ending notification sent for user:",
      userSubscription.user._id
    );
  } catch (error) {
    console.error("Error handling trial will end:", error);
  }
}

async function handleUpcomingInvoice(invoice: StripeInvoice) {
  console.log("Upcoming invoice:", invoice.id);

  try {
    const userSubscription = (await UserSubscription.findOne({
      stripeId: invoice.subscription,
    }).populate("user")) as PopulatedUserSubscription | null;

    if (!userSubscription) {
      console.error(
        "User subscription not found for upcoming invoice:",
        invoice.id
      );
      return;
    }

    // Send renewal reminder
    const user = userSubscription.user;
    if (user && user.email) {
      try {
        const renewalDate = new Date(
          invoice.period_end * 1000
        ).toLocaleDateString();
        await emailService.sendSubscriptionRenewalReminder(
          user.email,
          user.fullName,
          renewalDate
        );
      } catch (emailError) {
        console.error("Error sending renewal reminder email:", emailError);
      }
    }

    console.log("Renewal reminder sent for user:", userSubscription.user._id);
  } catch (error) {
    console.error("Error handling upcoming invoice:", error);
  }
}

// Handle payment action required (for 3D Secure, etc.)
async function handleInvoicePaymentActionRequired(invoice: StripeInvoice) {
  console.log("🔐 Invoice payment action required:", invoice.id);

  try {
    const userSubscription = (await UserSubscription.findOne({
      stripeId: invoice.subscription,
    }).populate("user subscription")) as PopulatedUserSubscription | null;

    if (!userSubscription) {
      console.error("❌ User subscription not found for invoice:", invoice.id);
      return;
    }

    // Update subscription status to incomplete if payment requires action
    userSubscription.status = SubscriptionStatus.INCOMPLETE;
    await userSubscription.save();

    const user = userSubscription.user;
    const subscription = userSubscription.subscription as ISubscription;

    if (user && user.email) {
      try {
        await emailService.sendPaymentActionRequiredNotification(
          user.email,
          user.fullName,
          {
            invoiceId: invoice.id,
            amount: invoice.amount_due / 100,
            currency: invoice.currency || "usd",
            planName: subscription?.name || "Subscription",
            invoiceUrl: invoice.hosted_invoice_url,
          }
        );

        console.log("📧 Payment action required email sent to:", user.email);
      } catch (emailError) {
        console.error(
          "❌ Error sending payment action required email:",
          emailError
        );
      }
    }

    console.log(
      "✅ Payment action required processed for user:",
      userSubscription.user._id
    );
  } catch (error) {
    console.error("❌ Error handling payment action required:", error);
  }
}

// Note: Past due status is handled through subscription.updated events

// Handle invoice finalized (when invoice is ready for payment)
async function handleInvoiceFinalized(invoice: StripeInvoice) {
  console.log("📄 Invoice finalized:", invoice.id);

  try {
    const userSubscription = (await UserSubscription.findOne({
      stripeId: invoice.subscription,
    }).populate(
      "user subscription subscriptionPrice"
    )) as PopulatedUserSubscription | null;

    if (!userSubscription) {
      console.error("❌ User subscription not found for invoice:", invoice.id);
      return;
    }

    // Check if this is a recurring payment (not the first payment)
    const existingPayments = await PaymentHistory.countDocuments({
      userSubscription: userSubscription._id,
      status: "paid",
    });
    const isRecurringPayment = existingPayments > 0;

    // Only send upcoming payment notifications for recurring payments
    if (isRecurringPayment) {
      const user = userSubscription.user;
      const subscription = userSubscription.subscription as ISubscription;
      const subscriptionPrice =
        userSubscription.subscriptionPrice as ISubscriptionPrice;

      if (user && user.email) {
        try {
          const invoiceDetails = {
            invoiceId: invoice.id,
            amount: invoice.amount_due / 100,
            currency: invoice.currency || "usd",
            dueDate: invoice.due_date
              ? new Date(invoice.due_date * 1000)
              : new Date(),
            planName: subscription?.name || "Subscription",
            billingPeriod:
              subscriptionPrice?.interval === "year" ? "Annual" : "Monthly",
            invoiceUrl: invoice.hosted_invoice_url,
          };

          await emailService.sendUpcomingPaymentNotification(
            user.email,
            user.fullName,
            invoiceDetails
          );

          console.log("📧 Upcoming payment notification sent to:", user.email);
        } catch (emailError) {
          console.error(
            "❌ Error sending upcoming payment notification:",
            emailError
          );
        }
      }
    }

    console.log(
      "✅ Invoice finalized processed for user:",
      userSubscription.user._id
    );
  } catch (error) {
    console.error("❌ Error handling invoice finalized:", error);
  }
}

export default {
  handleStripeWebhook,
};
