import emailService from "./emailService";
import {
  UserSubscription,
  SubscriptionStatus,
} from "../subscription/subscriptionModel";
import User from "../user/userModel";
import billingService from "./billingService";

// Interface for populated user in subscription queries
interface PopulatedUser {
  _id: string;
  email: string;
  fullName: string;
}

// Interface for populated subscription in queries
interface PopulatedSubscription {
  name: string;
}

export class ScheduledTasks {
  /**
   * Check for subscriptions expiring in 2 days and send reminder emails
   * Should be run daily
   */
  static async checkTwoDayExpirationReminders(): Promise<void> {
    try {
      console.log("🔍 Starting 2-day expiration reminder check...");
      await emailService.checkAndSendTwoDayReminders();
      console.log("✅ 2-day expiration reminder check completed");
    } catch (error) {
      console.error("❌ Error in 2-day expiration reminder check:", error);
    }
  }

  /**
   * Check for expired subscriptions and send notifications with due balance
   * Should be run daily
   */
  static async checkExpiredSubscriptions(): Promise<void> {
    try {
      console.log("🔍 Starting expired subscription check...");

      const now = new Date();

      // Find subscriptions that have expired but are still marked as active
      const expiredSubscriptions = await UserSubscription.find({
        currentPeriodEnd: { $lt: now },
        active: true,
        status: { $in: ["active", "trialing"] },
      }).populate("user subscription");

      console.log(
        `📋 Found ${expiredSubscriptions.length} expired subscriptions`
      );

      let processedCount = 0;
      for (const userSub of expiredSubscriptions) {
        try {
          const user = userSub.user as unknown as PopulatedUser;
          const subscription = userSub.subscription as PopulatedSubscription;

          if (user && subscription) {
            // Mark subscription as inactive
            userSub.active = false;
            userSub.status = SubscriptionStatus.CANCELLED;
            await userSub.save();

            // Update user's subscription plan to Basic
            await User.findByIdAndUpdate(user._id, {
              subscriptionPlan: "Basic",
            });

            // Try to get due balance from Stripe
            let dueBalanceData = undefined;
            if (userSub.stripeCustomerId) {
              try {
                const recentInvoice = await billingService.getUpcomingInvoice(
                  userSub.stripeCustomerId
                );
                if (recentInvoice && recentInvoice.amount_due > 0) {
                  dueBalanceData = {
                    amount: recentInvoice.amount_due / 100, // Convert from cents
                    currency: recentInvoice.currency || "usd",
                    dueDate: recentInvoice.due_date
                      ? new Date(recentInvoice.due_date * 1000)
                      : now,
                    planName: subscription.name,
                    invoiceUrl: recentInvoice.hosted_invoice_url || undefined,
                  };
                }
              } catch (invoiceError) {
                console.error(
                  `⚠️ Could not fetch due balance for user ${user.email}:`,
                  invoiceError
                );
              }
            }

            // Send expiration notification with due balance if available
            await emailService.sendSubscriptionExpiredNotification(
              user.email,
              user.fullName,
              subscription.name,
              dueBalanceData
            );

            processedCount++;
            console.log(
              `✅ Expired notification sent to ${user.email} for ${subscription.name} plan`
            );
          }
        } catch (emailError) {
          console.error(
            `❌ Failed to process expired subscription for user ${
              (userSub.user as unknown as PopulatedUser)?.email || "unknown"
            }:`,
            emailError
          );
        }
      }

      console.log(
        `✅ Expired subscription check completed. Processed ${processedCount} subscriptions.`
      );
    } catch (error) {
      console.error("❌ Error in expired subscription check:", error);
    }
  }

  /**
   * Run all scheduled tasks
   * This can be called by a cron job or scheduler
   */
  static async runDailyTasks(): Promise<void> {
    console.log("🚀 Starting daily scheduled tasks...");

    try {
      // Run 2-day expiration reminders
      await this.checkTwoDayExpirationReminders();

      // Small delay between tasks
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Run expired subscription check
      await this.checkExpiredSubscriptions();

      console.log("✅ All daily scheduled tasks completed successfully");
    } catch (error) {
      console.error("❌ Error running daily scheduled tasks:", error);
    }
  }

  /**
   * @deprecated Use CronJobManager instead for production
   * This method is kept for backward compatibility only
   */
  static startScheduler(): void {
    console.log(
      "⚠️ DEPRECATED: Use CronJobManager instead of setInterval-based scheduling"
    );
    console.log(
      "📅 For proper scheduling, use: import { cronJobManager } from './cronJobs'"
    );
    console.log(
      "📅 Then call: cronJobManager.initializeJobs() and cronJobManager.startJobs()"
    );
  }
}

export default ScheduledTasks;
