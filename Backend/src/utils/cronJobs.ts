import * as cron from "node-cron";
import emailService from "./emailService";
import billingService from "./billingService";
import {
  UserSubscription,
  SubscriptionStatus,
} from "../subscription/subscriptionModel";
import User from "../user/userModel";
import { config } from "../config/config";

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

export class CronJobManager {
  private static instance: CronJobManager;
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  private constructor() {}

  public static getInstance(): CronJobManager {
    if (!CronJobManager.instance) {
      CronJobManager.instance = new CronJobManager();
    }
    return CronJobManager.instance;
  }

  /**
   * Initialize all cron jobs
   */
  public initializeJobs(): void {
    console.log("🚀 Initializing cron jobs...");

    // Check for 2-day expiration reminders daily at 9:00 AM
    this.scheduleJob(
      "two-day-reminder",
      "0 9 * * *", // Every day at 9:00 AM
      this.checkTwoDayExpirationReminders.bind(this),
      "Two-day expiration reminder check"
    );

    // Check for expired subscriptions daily at 10:00 AM
    this.scheduleJob(
      "expired-subscriptions",
      "0 10 * * *", // Every day at 10:00 AM
      this.checkExpiredSubscriptions.bind(this),
      "Expired subscription check"
    );

    // Sync with Stripe daily at 3:00 AM for recurring payment verification
    this.scheduleJob(
      "stripe-sync",
      "0 3 * * *", // Every day at 3:00 AM
      this.syncRecurringPayments.bind(this),
      "Stripe recurring payment sync"
    );

    console.log(
      `✅ ${this.jobs.size} essential cron jobs initialized successfully`
    );
  }

  /**
   * Schedule a new cron job
   */
  private scheduleJob(
    name: string,
    schedule: string,
    task: () => Promise<void>,
    description: string
  ): void {
    if (this.jobs.has(name)) {
      console.log(`⚠️ Job '${name}' already exists, skipping...`);
      return;
    }

    const job = cron.schedule(
      schedule,
      async () => {
        const startTime = Date.now();
        console.log(`🔄 Starting job: ${name} (${description})`);

        try {
          await task();
          const duration = Date.now() - startTime;
          console.log(`✅ Job completed: ${name} (${duration}ms)`);
        } catch (error) {
          console.error(`❌ Job failed: ${name}`, error);
          // In production, you might want to send alerts here
        }
      },
      {
        timezone: "UTC", // Use UTC for consistency
      }
    );

    this.jobs.set(name, job);
    console.log(`📅 Scheduled job: ${name} (${schedule}) - ${description}`);
  }

  /**
   * Start all cron jobs
   */
  public startJobs(): void {
    console.log("▶️ Starting all cron jobs...");

    for (const [name, job] of this.jobs) {
      job.start();
      console.log(`✅ Started job: ${name}`);
    }

    console.log(`🚀 All ${this.jobs.size} cron jobs are now running`);
  }

  /**
   * Stop all cron jobs
   */
  public stopJobs(): void {
    console.log("⏹️ Stopping all cron jobs...");

    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`🛑 Stopped job: ${name}`);
    }

    console.log("⏹️ All cron jobs stopped");
  }

  /**
   * Get status of all jobs
   */
  public getJobStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};

    for (const [name, job] of this.jobs) {
      status[name] = job.getStatus() === "scheduled";
    }

    return status;
  }

  /**
   * Check for subscriptions expiring in 2 days and send reminder emails
   */
  private async checkTwoDayExpirationReminders(): Promise<void> {
    try {
      console.log("🔍 Starting 2-day expiration reminder check...");
      await emailService.checkAndSendTwoDayReminders();
      console.log("✅ 2-day expiration reminder check completed");
    } catch (error) {
      console.error("❌ Error in 2-day expiration reminder check:", error);
      throw error;
    }
  }

  /**
   * Check for expired subscriptions and send notifications with due balance
   */
  private async checkExpiredSubscriptions(): Promise<void> {
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

          if (user && user.email && user.fullName && subscription) {
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
      throw error;
    }
  }

  /**
   * Clean up old payment history records (older than 2 years)
   */
  /* Removed non-essential cleanup job to simplify cron set
  private async cleanupOldPaymentHistory(): Promise<void> {
    try {
      console.log("🧹 Starting payment history cleanup...");

      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const result = await PaymentHistory.deleteMany({
        createdAt: { $lt: twoYearsAgo },
      });

      console.log(
        `✅ Cleaned up ${result.deletedCount} old payment history records`
      );
    } catch (error) {
      console.error("❌ Error cleaning up payment history:", error);
      throw error;
    }
  }

  /**
   * Sync recurring payments with Stripe to ensure accuracy
   */
  private async syncRecurringPayments(): Promise<void> {
    try {
      console.log("🔄 Starting Stripe recurring payment sync...");

      // Get all active subscriptions
      const activeSubscriptions = await UserSubscription.find({
        active: true,
        stripeId: { $exists: true, $ne: null },
      }).populate("user");

      let syncedCount = 0;
      let errorCount = 0;

      for (const userSub of activeSubscriptions) {
        try {
          if (userSub.stripeId) {
            // Get fresh subscription data from Stripe
            const stripeSubscription = await billingService.getSubscription(
              userSub.stripeId
            );

            if (stripeSubscription) {
              // Update local subscription with fresh data
              const subscriptionData =
                billingService.serializeSubscriptionData(stripeSubscription);

              let hasChanges = false;

              // Check if status has changed
              if (userSub.status !== subscriptionData.status) {
                userSub.status = subscriptionData.status as SubscriptionStatus;
                hasChanges = true;
              }

              // Check if dates have changed
              if (
                userSub.currentPeriodStart?.getTime() !==
                subscriptionData.currentPeriodStart.getTime()
              ) {
                userSub.currentPeriodStart =
                  subscriptionData.currentPeriodStart;
                hasChanges = true;
              }

              if (
                userSub.currentPeriodEnd?.getTime() !==
                subscriptionData.currentPeriodEnd.getTime()
              ) {
                userSub.currentPeriodEnd = subscriptionData.currentPeriodEnd;
                hasChanges = true;
              }

              if (
                userSub.cancelAtPeriodEnd !== subscriptionData.cancelAtPeriodEnd
              ) {
                userSub.cancelAtPeriodEnd = subscriptionData.cancelAtPeriodEnd;
                hasChanges = true;
              }

              // Update activity status based on Stripe status
              const shouldBeActive = ["active", "trialing"].includes(
                stripeSubscription.status
              );
              if (userSub.active !== shouldBeActive) {
                userSub.active = shouldBeActive;
                hasChanges = true;
              }

              if (hasChanges) {
                await userSub.save();
                syncedCount++;
                console.log(
                  `🔄 Updated subscription for user: ${
                    (userSub.user as unknown as PopulatedUser)?.email ||
                    "unknown"
                  }`
                );
              }
            }
          }
        } catch (subError) {
          errorCount++;
          console.error(
            `❌ Error syncing subscription ${userSub.stripeId}:`,
            subError
          );
        }
      }

      console.log(
        `✅ Stripe sync completed. Updated: ${syncedCount}, Errors: ${errorCount}, Total: ${activeSubscriptions.length}`
      );
    } catch (error) {
      console.error("❌ Error in Stripe recurring payment sync:", error);
      throw error;
    }
  }

  /**
   * Perform system health checks
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // Check database connection
      const dbCheck = await UserSubscription.countDocuments();

      // Check Stripe connection (lightweight test)
      if (config.STRIPE_SECRET_KEY) {
        // This is a lightweight test - just verify the key format
        const isValidKey = config.STRIPE_SECRET_KEY.startsWith("sk_");
        if (!isValidKey) {
          throw new Error("Invalid Stripe secret key format");
        }
      }

      // Log health status (only log errors to avoid spam)
      if (dbCheck < 0) {
        console.error("❌ Database health check failed");
      }

      // In production, you might want to send health metrics to monitoring services
    } catch (error) {
      console.error("❌ Health check failed:", error);
      // Don't throw here to avoid stopping the health check cron
    }
  }

  /**
   * Check for failed payments that need retry notifications
   */
  /* Removed non-essential retry notification job
  private async checkFailedPaymentRetries(): Promise<void> {
    try {
      console.log("🔍 Starting failed payment retry check...");

      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      // Find recent failed payments that might be retrying
      const recentFailedPayments = await PaymentHistory.find({
        status: "failed",
        createdAt: { $gte: oneDayAgo },
        paymentType: { $in: ["recurring", "retry"] },
      }).populate("user userSubscription");

      console.log(
        `📋 Found ${recentFailedPayments.length} recent failed payments`
      );

      let processedCount = 0;
      for (const payment of recentFailedPayments) {
        try {
          // Check if this payment has been retried successfully since the failure
          const successfulRetry = await PaymentHistory.findOne({
            user: payment.user,
            userSubscription: payment.userSubscription,
            status: "paid",
            createdAt: { $gt: payment.createdAt },
          });

          if (!successfulRetry && payment.user) {
            const user = payment.user as unknown as {
              _id: string;
              email: string;
              fullName: string;
            };
            if (user.email && user.fullName) {
              // Calculate next retry date (Stripe typically retries after 3, 5, 7 days)
              const nextRetryDate = new Date(payment.createdAt);
              nextRetryDate.setDate(nextRetryDate.getDate() + 3);

              // Only send if we haven't sent a retry notification recently
              const recentNotification = await PaymentHistory.findOne({
                user: payment.user,
                description: { $regex: /retry notification/i },
                createdAt: { $gte: oneDayAgo },
              });

              if (!recentNotification) {
                console.log(`📧 Sending retry notification to ${user.email}`);
                // This would be handled by the webhook when Stripe actually retries
                processedCount++;
              }
            }
          }
        } catch (emailError) {
          console.error(
            `❌ Failed to process failed payment retry for user:`,
            emailError
          );
        }
      }

      console.log(
        `✅ Failed payment retry check completed. Processed ${processedCount} payments.`
      );
    } catch (error) {
      console.error("❌ Error in failed payment retry check:", error);
      throw error;
    }
  }

  /**
   * Monitor past due subscriptions for extended periods
   */
  /* Removed non-essential long past due monitor job
  private async monitorPastDueSubscriptions(): Promise<void> {
    try {
      console.log("🔍 Starting past due subscription monitoring...");

      // Find subscriptions that have been past due for more than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const longPastDueSubscriptions = await UserSubscription.find({
        status: SubscriptionStatus.PAST_DUE,
        updatedAt: { $lt: sevenDaysAgo },
        active: true,
      }).populate("user subscription");

      console.log(
        `📋 Found ${longPastDueSubscriptions.length} long past due subscriptions`
      );

      let processedCount = 0;
      for (const userSub of longPastDueSubscriptions) {
        try {
          const user = userSub.user as unknown as {
            _id: string;
            email: string;
            fullName: string;
          };
          const subscription = userSub.subscription as unknown as {
            name: string;
          };

          if (user && user.email && user.fullName && subscription) {
            // Check if payment has been attempted recently via Stripe
            if (userSub.stripeId) {
              try {
                const stripeSubscription = await billingService.getSubscription(
                  userSub.stripeId
                );

                if (stripeSubscription) {
                  // If Stripe subscription is canceled, update local status
                  if (stripeSubscription.status === "canceled") {
                    userSub.status = SubscriptionStatus.CANCELLED;
                    userSub.active = false;
                    await userSub.save();

                    // Update user's subscription plan to Basic
                    await User.findByIdAndUpdate(user._id, {
                      subscriptionPlan: "Basic",
                    });

                    console.log(
                      `🔄 Updated cancelled subscription for user: ${user.email}`
                    );
                    processedCount++;
                  }
                  // If still past_due in Stripe after 7 days, consider final notice
                  else if (stripeSubscription.status === "past_due") {
                    // Send final notice email (could be implemented)
                    console.log(
                      `⚠️ Long past due subscription for user: ${user.email}`
                    );
                  }
                }
              } catch (stripeError) {
                console.error(
                  `❌ Error checking Stripe subscription ${userSub.stripeId}:`,
                  stripeError
                );
              }
            }
          }
        } catch (subError) {
          console.error(
            `❌ Failed to process long past due subscription:`,
            subError
          );
        }
      }

      console.log(
        `✅ Past due monitoring completed. Processed ${processedCount} subscriptions.`
      );
    } catch (error) {
      console.error("❌ Error in past due subscription monitoring:", error);
      throw error;
    }
  }

  /**
   * Manual trigger for testing (development only)
   */
  public async runJobManually(jobName: string): Promise<void> {
    if (config.NODE_ENV === "production") {
      throw new Error("Manual job execution is not allowed in production");
    }

    console.log(`🔧 Manually executing job: ${jobName}`);

    switch (jobName) {
      case "two-day-reminder":
        await this.checkTwoDayExpirationReminders();
        break;
      case "expired-subscriptions":
        await this.checkExpiredSubscriptions();
        break;
      case "stripe-sync":
        await this.syncRecurringPayments();
        break;
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }

    console.log(`✅ Manual job execution completed: ${jobName}`);
  }
}

// Export singleton instance
export const cronJobManager = CronJobManager.getInstance();

// Graceful shutdown handler
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, stopping cron jobs...");
  cronJobManager.stopJobs();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, stopping cron jobs...");
  cronJobManager.stopJobs();
  process.exit(0);
});

export default cronJobManager;
