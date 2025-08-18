import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import { AuthRequest } from "../middlewares/tokenVerification";
import {
  Subscription,
  SubscriptionPrice,
  UserSubscription,
  PaymentHistory,
  SubscriptionStatus,
  IntervalChoices,
  ISubscription,
  ISubscriptionPrice,
  IUserSubscription,
} from "./subscriptionModel";
// Removed test clock related type imports

// Interface for populated user in subscription queries
interface PopulatedUser {
  _id: string;
  email: string;
  fullName: string;
}
import User from "../user/userModel";
import billingService from "../utils/billingService";
import { config } from "../config/config";
import emailService from "../utils/emailService";
import Pitch from "../pitch/pitchModel";
import subscriptionAccessControl from "../middlewares/subscriptionAccessControl";

// Core initializer (no req/res) so it can be used at app startup too
export const initializeSubscriptionPlans = async () => {
  try {
    // Check if plans already exist
    const existingPlans = await Subscription.countDocuments();
    if (existingPlans > 0) {
      console.log("Subscription plans already initialized");
      return { created: false, totalPlans: existingPlans };
    }

    // Create Entrepreneur Basic Plan
    const basicPlan = new Subscription({
      name: "Basic",
      subtitle: "Local Visibility. Essential Access.",
      userType: "entrepreneur",
      pitchLimit: 1,
      globalVisibility: false,
      features: `Pitch listed and visible only in your selected country
Submit one business pitch
Standard customer support
Access to investor network within your region
Designed for local market exposure`,
      permissions: ["basic"],
      order: 1,
      featured: true,
    });

    // Create Entrepreneur Premium Plan
    const premiumPlan = new Subscription({
      name: "Premium",
      subtitle: "Global Reach. Premium Benefits.",
      userType: "entrepreneur",
      pitchLimit: 5,
      globalVisibility: true,
      features: `Pitch listed and visible across all countries
Featured at the top of global search results
Upload supporting documents for investors
Submit up to 5 pitches
Priority customer support
Wider exposure to international investors
Higher chance of visibility and engagement`,
      permissions: ["pro"],
      order: 2,
      featured: true,
    });

    // Create Investor Plan
    const investorPlan = new Subscription({
      name: "Investor Access Plan",
      subtitle: "Discover High-Potential Ventures. Connect Globally.",
      userType: "investor",
      pitchLimit: 0, // No limit for investors
      globalVisibility: true,
      features: `Browse and view business pitches from all countries
Advanced search filters by industry, country, and funding stage
Access to detailed pitch information and supporting documents
Direct contact with entrepreneurs that match your investment interests
Receive curated pitch recommendations based on your preferences
Priority customer support for faster assistance and inquiries
Save pitches to review or revisit anytime
Ideal for investors seeking quality deal flow and global opportunities`,
      permissions: ["pro"],
      order: 3,
      featured: true,
    });

    await Promise.all([
      basicPlan.save(),
      premiumPlan.save(),
      investorPlan.save(),
    ]);

    // Create prices for entrepreneur plans
    const basicPrice = new SubscriptionPrice({
      subscription: basicPlan._id,
      interval: IntervalChoices.MONTHLY,
      price: 49.0,
      featured: true,
      order: 1,
    });

    const premiumPrice = new SubscriptionPrice({
      subscription: premiumPlan._id,
      interval: IntervalChoices.MONTHLY,
      price: 69.0,
      featured: true,
      order: 2,
    });

    // Create price for investor plan (yearly)
    const investorPrice = new SubscriptionPrice({
      subscription: investorPlan._id,
      interval: IntervalChoices.YEARLY,
      price: 49.0,
      featured: true,
      order: 3,
    });

    await Promise.all([
      basicPrice.save(),
      premiumPrice.save(),
      investorPrice.save(),
    ]);

    console.log("Subscription plans initialized successfully");
    return { created: true, totalPlans: 3 };
  } catch (error) {
    console.error("Error initializing subscription plans:", error);
    throw error;
  }
};

// Express handler wrapper for Postman/API usage
export const initializeSubscriptionPlansHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await initializeSubscriptionPlans();
    if (!result.created) {
      return res.status(200).json({
        success: true,
        message: "Subscription plans already initialized",
        totalPlans: result.totalPlans,
      });
    }
    return res.status(201).json({
      success: true,
      message: "Subscription plans initialized successfully",
      totalPlans: result.totalPlans,
    });
  } catch {
    return next(
      createHttpError(500, "Failed to initialize subscription plans")
    );
  }
};

// Get available subscription plans
export const getSubscriptionPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userType } = req.query;

    interface FilterType {
      active: boolean;
      userType?: "entrepreneur" | "investor";
    }

    const filter: FilterType = { active: true };
    if (userType && (userType === "entrepreneur" || userType === "investor")) {
      filter.userType = userType;
    }

    const plans = await Subscription.find(filter).sort({
      order: 1,
      featured: -1,
    });
    const planIds = plans.map((plan) => plan._id);

    const prices = await SubscriptionPrice.find({
      subscription: { $in: planIds },
      featured: true,
    })
      .populate("subscription")
      .sort({ order: 1, featured: -1 });

    const formattedPlans = plans.map((plan) => {
      const planPrices = prices.filter((price) => {
        const subscription = price.subscription as ISubscription;
        return (
          (subscription._id as mongoose.Types.ObjectId).toString() ===
          (plan._id as mongoose.Types.ObjectId).toString()
        );
      });

      return {
        id: plan._id,
        name: plan.name,
        subtitle: plan.subtitle,
        userType: plan.userType,
        pitchLimit: plan.pitchLimit,
        globalVisibility: plan.globalVisibility,
        features: plan.features.split("\n").filter((f) => f.trim()),
        prices: planPrices.map((price) => ({
          id: price._id,
          amount: parseFloat(price.price.toString()),
          currency: price.currency,
          interval: price.interval,
          stripeId: price.stripeId,
        })),
      };
    });

    res.status(200).json({
      success: true,
      plans: formattedPlans,
    });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return next(createHttpError(500, "Failed to fetch subscription plans"));
  }
};

// Get user's current subscription
export const getUserSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _req = req as AuthRequest;
    const userId = _req.userId;

    console.log("🔍 Fetching user subscription for user:", userId);

    const userSubscription = (await UserSubscription.findOne({ user: userId })
      .populate("subscription")
      .populate("subscriptionPrice")) as IUserSubscription | null;

    if (!userSubscription) {
      console.log("❌ No subscription found for user:", userId);
      return res.status(200).json({
        success: true,
        subscription: null,
      });
    }

    console.log("✅ Found user subscription:", {
      id: userSubscription._id,
      subscriptionId: userSubscription.subscription,
      subscriptionName: userSubscription.getPlanName(),
      status: userSubscription.status,
      active: userSubscription.active,
    });

    const serializedSubscription = userSubscription.serialize();
    console.log("📊 Serialized subscription data:", serializedSubscription);

    res.status(200).json({
      success: true,
      subscription: serializedSubscription,
    });
  } catch (error) {
    console.error("❌ Error fetching user subscription:", error);
    return next(createHttpError(500, "Failed to fetch subscription"));
  }
};

// Create checkout session for subscription
export const createCheckoutSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _req = req as AuthRequest;
    const userId = _req.userId;
    const { priceId } = req.body as {
      priceId?: string;
    };

    console.log("Creating checkout session for:", { userId, priceId });

    if (!priceId) {
      return next(
        createHttpError(400, "Please select a subscription plan to continue")
      );
    }

    // Check if user already has an active subscription
    const existingSubscription = await UserSubscription.findOne({
      user: userId,
      active: true,
      status: { $in: ["active", "trialing"] },
      currentPeriodEnd: { $gt: new Date() },
    });

    if (existingSubscription) {
      return next(
        createHttpError(
          400,
          "You already have an active subscription. Please cancel your current subscription before purchasing a new one."
        )
      );
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return next(
        createHttpError(404, "User account not found. Please log in again.")
      );
    }
    console.log("Found user:", { userId: user._id, email: user.email });

    // Get subscription price details with proper type assertion
    const subscriptionPrice = await SubscriptionPrice.findById(priceId)
      .populate<{ subscription: ISubscription }>("subscription")
      .exec();

    if (!subscriptionPrice) {
      return next(
        createHttpError(
          404,
          "Selected subscription plan is not available. Please try again or contact support."
        )
      );
    }
    console.log("Found subscription price:", {
      priceId: subscriptionPrice._id,
      stripeId: subscriptionPrice.stripeId,
      subscription: subscriptionPrice.subscription,
    });

    // Enforce role-to-plan userType matching
    const planUserType = (subscriptionPrice.subscription as ISubscription)
      .userType;
    const isEntrepreneurUser = user.role === "Entrepreneur";
    if (
      (isEntrepreneurUser && planUserType !== "entrepreneur") ||
      (!isEntrepreneurUser && planUserType !== "investor")
    ) {
      return next(
        createHttpError(
          403,
          "You are not allowed to purchase this plan. Please select a plan that matches your account type."
        )
      );
    }

    // Business rule: Entrepreneurs with >1 published pitches cannot purchase Basic plan
    const isEntrepreneurPlan =
      subscriptionPrice.subscription &&
      (subscriptionPrice.subscription as ISubscription).userType ===
        "entrepreneur";
    const isBasicPlan =
      subscriptionPrice.subscription &&
      (subscriptionPrice.subscription as ISubscription).name === "Basic";

    if (isEntrepreneurPlan && isBasicPlan) {
      const publishedPitchesCount = await Pitch.countDocuments({
        userId: userId,
        status: "published",
        isActive: true,
      });
      if (publishedPitchesCount > 1) {
        return next(
          createHttpError(
            400,
            "You have more than one published pitch. You cannot purchase the Basic plan. Please choose Premium."
          )
        );
      }
    }

    // Create or get Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      console.log("Creating new Stripe customer for user:", user._id);
      stripeCustomerId = await billingService.createCustomer({
        name: user.fullName,
        email: user.email,
        metadata: {
          userId: user._id.toString(),
        },
      });

      // Update user with Stripe customer ID
      await User.findByIdAndUpdate(user._id, { stripeCustomerId });
      console.log("Updated user with Stripe customer ID:", stripeCustomerId);
    }

    // Verify or recreate Stripe product and price
    let stripePrice = subscriptionPrice.stripeId;

    // If price exists, verify it in Stripe
    if (stripePrice) {
      try {
        const priceExists = await billingService.verifyPrice(stripePrice);
        if (!priceExists) {
          console.log("Stripe price not found, will recreate:", stripePrice);
          stripePrice = undefined;
          subscriptionPrice.stripeId = undefined;
          await subscriptionPrice.save();
        }
      } catch (error) {
        console.log("Error verifying price, will recreate:", error);
        stripePrice = undefined;
        subscriptionPrice.stripeId = undefined;
        await subscriptionPrice.save();
      }
    }

    // Create Stripe product and price if needed
    if (!stripePrice) {
      console.log("Creating Stripe product and price");
      const subscription = subscriptionPrice.subscription;
      let productStripeId = subscription.stripeId;

      // Verify or recreate product
      if (productStripeId) {
        try {
          const productExists = await billingService.verifyProduct(
            productStripeId
          );
          if (!productExists) {
            console.log(
              "Stripe product not found, will recreate:",
              productStripeId
            );
            productStripeId = undefined;
            subscription.stripeId = undefined;
            await subscription.save();
          }
        } catch (error) {
          console.log("Error verifying product, will recreate:", error);
          productStripeId = undefined;
          subscription.stripeId = undefined;
          await subscription.save();
        }
      }

      // Create product if needed
      if (!productStripeId) {
        productStripeId = await billingService.createProduct({
          name: `${subscription.name} - ${subscription.userType}`,
          metadata: {
            subscriptionId: subscription._id.toString(),
          },
        });

        subscription.stripeId = productStripeId;
        await subscription.save();
        console.log("Created new Stripe product:", productStripeId);
      }

      // Create price
      stripePrice = await billingService.createPrice({
        unitAmount: subscriptionPrice.getStripePrice(),
        interval: subscriptionPrice.interval as "month" | "year",
        productId: productStripeId,
        metadata: {
          subscriptionPriceId: subscriptionPrice._id.toString(),
        },
      });

      subscriptionPrice.stripeId = stripePrice;
      await subscriptionPrice.save();
      console.log("Created new Stripe price:", stripePrice);
    }

    console.log("Creating checkout session with:", {
      customerId: stripeCustomerId,
      priceId: stripePrice,
      successUrl: `${config.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${config.FRONTEND_URL}/payment/failure?cancelled=true`,
    });

    // Create checkout session
    const session = await billingService.createCheckoutSession({
      customerId: stripeCustomerId,
      priceStripeId: stripePrice,
      successUrl: `${config.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${config.FRONTEND_URL}/payment/failure?cancelled=true`,
      metadata: {
        userId: user._id.toString(),
        priceId: subscriptionPrice._id.toString(),
      },
    });

    console.log("Created checkout session:", {
      sessionId: session.id,
      url: session.url,
    });

    res.status(200).json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    if (error instanceof Error) {
      return next(
        createHttpError(
          500,
          `Failed to create checkout session: ${error.message}`
        )
      );
    }
    return next(createHttpError(500, "Failed to create checkout session"));
  }
};

// Handle successful payment (called from success page)
export const handleSuccessfulPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("🚀 Payment success handler called");
    console.log("📦 Request body:", req.body);

    const { sessionId } = req.body;

    if (!sessionId) {
      console.log("❌ No session ID provided");
      return next(createHttpError(400, "Session ID is required"));
    }

    console.log("✅ Processing session ID:", sessionId);
    const checkoutData = await billingService.getCheckoutCustomerPlan(
      sessionId
    );
    console.log("📊 Checkout data received:", {
      customerId: checkoutData.customerId,
      subscriptionId: checkoutData.subscriptionId,
      priceId: checkoutData.priceId,
      status: checkoutData.status,
    });

    // Find the price and subscription
    console.log(
      "🔍 Looking for subscription price with Stripe ID:",
      checkoutData.priceId
    );
    const subscriptionPrice = (await SubscriptionPrice.findOne({
      stripeId: checkoutData.priceId,
    }).populate("subscription")) as ISubscriptionPrice | null;

    if (!subscriptionPrice) {
      console.log(
        "❌ Subscription price not found for Stripe ID:",
        checkoutData.priceId
      );
      return next(createHttpError(404, "Subscription price not found"));
    }

    console.log("✅ Found subscription price:", {
      id: subscriptionPrice._id,
      price: subscriptionPrice.price,
      subscriptionName: (subscriptionPrice.subscription as ISubscription)?.name,
    });

    // Find user by stripe customer ID
    console.log(
      "🔍 Looking for user with Stripe customer ID:",
      checkoutData.customerId
    );
    const user = await User.findOne({
      stripeCustomerId: checkoutData.customerId,
    });
    if (!user) {
      console.log(
        "❌ User not found for Stripe customer ID:",
        checkoutData.customerId
      );
      return next(createHttpError(404, "User not found"));
    }

    console.log("✅ Found user:", {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
    });

    // Create or update user subscription
    console.log(
      "🔍 Looking for existing user subscription for user:",
      user._id
    );
    let userSubscription = (await UserSubscription.findOne({
      user: user._id,
    })) as IUserSubscription | null;

    if (!userSubscription) {
      console.log("➕ Creating new user subscription");
      userSubscription = new UserSubscription({
        user: user._id,
        subscription: (subscriptionPrice.subscription as ISubscription)._id,
        subscriptionPrice: subscriptionPrice._id,
      }) as IUserSubscription;
    } else {
      console.log(
        "🔄 Updating existing user subscription:",
        userSubscription._id
      );

      // **CRITICAL FIX**: Update subscription and price references for upgrades/downgrades
      console.log("🔄 Updating subscription reference from old to new:", {
        oldSubscription: userSubscription.subscription,
        newSubscription: (subscriptionPrice.subscription as ISubscription)._id,
        oldPrice: userSubscription.subscriptionPrice,
        newPrice: subscriptionPrice._id,
      });
      userSubscription.subscription = (
        subscriptionPrice.subscription as ISubscription
      )._id;
      userSubscription.subscriptionPrice = subscriptionPrice._id;
    }

    // Update subscription details with safe period handling
    userSubscription.stripeId = checkoutData.subscriptionId;
    userSubscription.stripeCustomerId = checkoutData.customerId;
    userSubscription.status = checkoutData.status as SubscriptionStatus;

    const startDate = checkoutData.currentPeriodStart;
    let endDate = checkoutData.currentPeriodEnd;

    // Fallback: if Stripe returned missing/invalid period end, derive from interval
    if (!endDate || !startDate || endDate.getTime() <= startDate.getTime()) {
      const derivedEnd = new Date(startDate);
      const interval = subscriptionPrice.interval;
      if (interval === "year") {
        derivedEnd.setFullYear(derivedEnd.getFullYear() + 1);
      } else {
        derivedEnd.setMonth(derivedEnd.getMonth() + 1);
      }
      endDate = derivedEnd;
      console.log(
        "🛠️ Derived period end date due to missing/invalid Stripe value:",
        {
          startDate,
          endDate,
          interval,
        }
      );
    }

    userSubscription.currentPeriodStart = startDate;
    userSubscription.currentPeriodEnd = endDate;
    userSubscription.cancelAtPeriodEnd = checkoutData.cancelAtPeriodEnd;
    userSubscription.active = true;
    // Set billing cycle anchor for easier reporting/debugging
    userSubscription.billingCycleAnchor = startDate;

    console.log("💾 Saving user subscription with data:", {
      stripeId: checkoutData.subscriptionId,
      status: checkoutData.status,
      currentPeriodStart: checkoutData.currentPeriodStart,
      currentPeriodEnd: checkoutData.currentPeriodEnd,
    });

    await userSubscription.save();
    console.log("✅ User subscription saved successfully");

    // Update user's subscription plan
    const planName = (subscriptionPrice.subscription as ISubscription).name;
    console.log("🔄 Updating user subscription plan to:", planName);
    await User.findByIdAndUpdate(user._id, {
      subscriptionPlan: planName,
    });
    console.log("✅ User plan updated successfully");

    // **CRITICAL FIX**: Create payment history record for immediate payment success
    try {
      console.log("💳 Creating payment history record...");

      // Get the checkout session to find invoice information
      const checkoutSession = await billingService.getCheckoutSession(
        sessionId
      );

      if (checkoutSession) {
        // Check if payment history already exists for this session
        const existingPaymentHistory = await PaymentHistory.findOne({
          user: user._id,
          stripeInvoiceId: checkoutSession.invoice as string,
        });

        if (!existingPaymentHistory && checkoutSession.invoice) {
          console.log("📄 Creating new payment history record");
          const paymentHistory = new PaymentHistory({
            user: user._id,
            userSubscription: userSubscription._id,
            stripeInvoiceId: checkoutSession.invoice as string,
            stripePaymentIntentId: checkoutSession.payment_intent as string,
            amount: (checkoutSession.amount_total || 0) / 100, // Convert from cents
            currency: checkoutSession.currency || "usd",
            status: "paid",
            description: `${planName} subscription payment`,
            invoiceUrl: null, // Will be populated by webhook if available
            paidAt: new Date(),
            dueDate: new Date(),
            paymentType: "initial", // Mark as initial payment
            retryCount: 0,
          });

          await paymentHistory.save();
          console.log("✅ Payment history record created successfully");
        } else {
          console.log("ℹ️ Payment history already exists or no invoice found");
        }
      }
    } catch (paymentHistoryError) {
      console.error("❌ Error creating payment history:", paymentHistoryError);
      // Don't fail the entire payment process for this
    }

    // Send plan-specific confirmation email with receipt data
    try {
      const subscriptionPlan = subscriptionPrice.subscription as ISubscription;
      const planName = subscriptionPlan.name;
      const userType = subscriptionPlan.userType;

      console.log("📧 Sending confirmation email for:", {
        planName,
        userType,
        email: user.email,
      });

      // Prepare receipt data from checkout session
      let receiptData = null;
      try {
        const checkoutSession = await billingService.getCheckoutSession(
          sessionId
        );
        if (checkoutSession && checkoutSession.invoice) {
          // Calculate billing period based on subscription interval
          const interval = subscriptionPrice.interval;
          const billingPeriod = interval === "year" ? "Annual" : "Monthly";

          // Calculate next billing date
          const nextBillingDate = new Date(userSubscription.currentPeriodEnd);

          // Avoid duplicating the word "Plan" in display name
          const planDisplayName = planName.includes("Plan")
            ? `${planName}${userType ? ` (${userType})` : ""}`
            : `${planName}${userType ? ` (${userType})` : ""}`;

          receiptData = {
            invoiceId: checkoutSession.invoice as string,
            amount: (checkoutSession.amount_total || 0) / 100, // Convert from cents
            currency: checkoutSession.currency || "usd",
            planName: planDisplayName,
            billingPeriod,
            paymentDate: new Date(),
            nextBillingDate,
            invoiceUrl: undefined, // Will be populated by webhook if available
          };

          console.log("📋 Receipt data prepared:", receiptData);
        }
      } catch (receiptError) {
        console.error("⚠️ Could not prepare receipt data:", receiptError);
        // Continue without receipt data
      }

      // Send plan-specific email based on subscription type with receipt
      if (userType === "entrepreneur") {
        if (planName === "Basic") {
          await emailService.sendEntrepreneurBasicPlanConfirmation(
            user.email,
            user.fullName,
            receiptData || undefined
          );
          console.log("✅ Basic plan confirmation email sent with receipt");
        } else if (planName === "Premium") {
          await emailService.sendEntrepreneurPremiumPlanConfirmation(
            user.email,
            user.fullName,
            receiptData || undefined
          );
          console.log("✅ Premium plan confirmation email sent with receipt");
        } else {
          // Fallback to generic confirmation
          await emailService.sendSubscriptionConfirmation(
            user.email,
            user.fullName
          );
          console.log("✅ Generic confirmation email sent");
        }
      } else if (userType === "investor") {
        await emailService.sendInvestorAnnualPlanConfirmation(
          user.email,
          user.fullName,
          receiptData || undefined
        );
        console.log("✅ Investor plan confirmation email sent with receipt");
      } else {
        // Fallback to generic confirmation
        await emailService.sendSubscriptionConfirmation(
          user.email,
          user.fullName
        );
        console.log("✅ Generic confirmation email sent");
      }
    } catch (emailError) {
      console.error("❌ Error sending confirmation email:", emailError);
    }

    console.log("✅ Payment processed successfully, sending response");
    res.status(200).json({
      success: true,
      message: "Subscription activated successfully",
      subscription: userSubscription.serialize(),
    });
  } catch (error) {
    console.error("❌ Error handling successful payment:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    return next(createHttpError(500, "Failed to process successful payment"));
  }
};

// Cancel subscription
export const cancelSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("🔧 Cancel subscription request received");
    const _req = req as AuthRequest;
    const userId = _req.userId;

    if (!userId) {
      console.log("❌ No user ID found in request");
      return next(createHttpError(401, "User not authenticated"));
    }

    console.log("👤 User ID:", userId);
    console.log("📦 Request body:", req.body);

    const {
      reason = "User requested cancellation",
      feedback = "other",
      immediate = false,
    } = req.body;

    console.log("🔍 Looking for user subscription...");
    const userSubscription = (await UserSubscription.findOne({
      user: userId,
    })) as IUserSubscription | null;

    if (!userSubscription || !userSubscription.stripeId) {
      console.log("❌ No subscription found for user:", userId);
      return next(createHttpError(404, "No active subscription found"));
    }

    console.log("📊 User subscription status:", userSubscription.status);
    console.log("🔄 Is active status:", userSubscription.isActiveStatus());

    if (!userSubscription.isActiveStatus()) {
      console.log(
        "❌ Subscription is not in active status:",
        userSubscription.status
      );
      return next(createHttpError(400, "Subscription is not active"));
    }

    // Cancel in Stripe
    console.log(
      "🔄 Cancelling subscription in Stripe:",
      userSubscription.stripeId
    );
    console.log("📝 Cancellation params:", { reason, feedback, immediate });

    const cancelledSubscription = await billingService.cancelSubscription(
      userSubscription.stripeId,
      reason,
      feedback,
      !immediate // cancel at period end unless immediate is requested
    );

    if (!cancelledSubscription) {
      console.log("❌ Failed to cancel subscription in Stripe");
      return next(createHttpError(500, "Failed to cancel subscription"));
    }

    console.log(
      "✅ Subscription cancelled in Stripe:",
      cancelledSubscription.status
    );

    // Update local subscription safely
    userSubscription.status =
      cancelledSubscription.status === "canceled"
        ? SubscriptionStatus.CANCELLED
        : (cancelledSubscription.status as SubscriptionStatus);
    userSubscription.cancelAtPeriodEnd =
      cancelledSubscription.cancel_at_period_end || false;
    userSubscription.userCancelled = true;

    // Only update dates if they exist and are valid
    const subscriptionWithDates = cancelledSubscription as unknown as {
      current_period_start?: number;
      current_period_end?: number;
    };

    if (subscriptionWithDates.current_period_start) {
      userSubscription.currentPeriodStart = new Date(
        subscriptionWithDates.current_period_start * 1000
      );
    }
    if (subscriptionWithDates.current_period_end) {
      userSubscription.currentPeriodEnd = new Date(
        subscriptionWithDates.current_period_end * 1000
      );
    }

    // If subscription is immediately canceled, mark as inactive
    if (immediate || cancelledSubscription.status === "canceled") {
      userSubscription.active = false;
    }

    await userSubscription.save();

    // 🔥 CRITICAL FIX: Immediately downgrade user's plan when subscription is cancelled
    // This ensures they lose premium features immediately, even if subscription is active until period end
    console.log(
      "🔄 Downgrading user subscription plan to Basic after cancellation"
    );
    await User.findByIdAndUpdate(userSubscription.user, {
      subscriptionPlan: "Basic",
    });
    console.log("✅ User subscription plan downgraded to Basic");

    // Send cancellation email notification
    try {
      const user = await User.findById(userSubscription.user);
      if (user) {
        // Get subscription plan name for the email
        const subscription = await UserSubscription.findById(
          userSubscription._id
        ).populate("subscription");
        const planName =
          (subscription?.subscription as ISubscription)?.name || "Subscription";

        // Use the new dedicated cancellation email
        await emailService.sendSubscriptionCancellationConfirmation(
          user.email,
          user.fullName,
          planName,
          userSubscription.currentPeriodEnd || new Date(),
          immediate || cancelledSubscription.status === "canceled"
        );

        console.log(
          `✅ Cancellation email sent to ${user.email} for ${planName} plan`
        );
      }
    } catch (emailError) {
      console.error("Error sending cancellation email:", emailError);
    }

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      subscription: userSubscription.serialize(),
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return next(createHttpError(500, "Failed to cancel subscription"));
  }
};

// Get payment history
export const getPaymentHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _req = req as AuthRequest;
    const userId = _req.userId;
    const { page = 1, limit = 20, year, status } = req.query;

    console.log("🔍 Fetching payment history for user:", userId);
    console.log("📋 Query params:", { page, limit, year, status });

    // Build filter
    interface PaymentFilter {
      user: string;
      createdAt?: { $gte: Date; $lte: Date };
      status?: string;
    }

    const filter: PaymentFilter = { user: userId };

    // Add year filter
    if (year && year !== "all" && typeof year === "string") {
      const startOfYear = new Date(`${year}-01-01`);
      const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
      filter.createdAt = { $gte: startOfYear, $lte: endOfYear };
    }

    // Add status filter
    if (status && status !== "all" && typeof status === "string") {
      filter.status = status;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [paymentHistory, totalCount] = await Promise.all([
      PaymentHistory.find(filter)
        .populate("userSubscription")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      PaymentHistory.countDocuments(filter),
    ]);

    // Enrich missing invoice URLs from Stripe when available
    for (const p of paymentHistory) {
      if (!p.invoiceUrl && p.stripeInvoiceId) {
        try {
          const inv = await billingService.getInvoiceById(p.stripeInvoiceId);
          if (inv && (inv.hosted_invoice_url || inv.invoice_pdf)) {
            const resolvedUrl: string | undefined =
              (inv.hosted_invoice_url as string | undefined) ||
              (inv.invoice_pdf as string | undefined);
            await PaymentHistory.updateOne(
              { _id: p._id },
              { $set: { invoiceUrl: resolvedUrl } }
            );
            p.invoiceUrl = resolvedUrl;
          }
        } catch {
          // ignore enrichment failure
        }
      }
    }

    console.log("📊 Found payments:", paymentHistory.length);

    // Format the response with better structure
    const formattedPayments = paymentHistory.map((payment) => ({
      _id: payment._id,
      stripeInvoiceId: payment.stripeInvoiceId,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      paymentType: payment.paymentType,
      description: payment.description || "Subscription payment",
      invoiceUrl: payment.invoiceUrl,
      paidAt: payment.paidAt,
      dueDate: payment.dueDate,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));

    res.status(200).json({
      success: true,
      payments: formattedPayments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching payment history:", error);
    return next(createHttpError(500, "Failed to fetch payment history"));
  }
};

// Refresh subscription data from Stripe
export const refreshSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _req = req as AuthRequest;
    const userId = _req.userId;

    const userSubscription = (await UserSubscription.findOne({
      user: userId,
    })) as IUserSubscription | null;

    if (!userSubscription || !userSubscription.stripeId) {
      return next(createHttpError(404, "No subscription found"));
    }

    // Get fresh data from Stripe
    const stripeSubscription = await billingService.getSubscription(
      userSubscription.stripeId
    );

    if (!stripeSubscription) {
      return next(createHttpError(404, "Subscription not found in Stripe"));
    }

    // Update local subscription with fresh data
    const subscriptionData =
      billingService.serializeSubscriptionData(stripeSubscription);
    Object.assign(userSubscription, subscriptionData);
    await userSubscription.save();

    res.status(200).json({
      success: true,
      subscription: userSubscription.serialize(),
    });
  } catch (error) {
    console.error("Error refreshing subscription:", error);
    return next(createHttpError(500, "Failed to refresh subscription"));
  }
};

// Sync subscription plans with Stripe
export const syncStripeProducts = async () => {
  try {
    // Get all subscriptions and prices
    const subscriptions = await Subscription.find().exec();
    const prices = await SubscriptionPrice.find()
      .populate<{ subscription: ISubscription }>("subscription")
      .exec();

    // Create products in Stripe
    for (const subscription of subscriptions) {
      if (!subscription.stripeId) {
        const stripeProduct = await billingService.createProduct({
          name: `${subscription.name} - ${subscription.userType}`,
          metadata: {
            subscriptionId: subscription._id.toString(),
          },
        });

        subscription.stripeId = stripeProduct;
        await subscription.save();
      }
    }

    // Create prices in Stripe
    for (const price of prices) {
      if (!price.stripeId && price.subscription?.stripeId) {
        const stripePrice = await billingService.createPrice({
          unitAmount: Math.round(Number(price.price) * 100), // Convert to cents
          interval: price.interval.toLowerCase() as "month" | "year",
          productId: price.subscription.stripeId,
          metadata: {
            subscriptionPriceId: price._id.toString(),
          },
        });

        price.stripeId = stripePrice;
        await price.save();
      }
    }

    console.log("Successfully synced products and prices with Stripe");
  } catch (error) {
    console.error("Error syncing with Stripe:", error);
    throw error; // Re-throw to be handled by error middleware
  }
};

// Check and send 2-day expiration reminders
export const checkTwoDayExpirationReminders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("🔍 Checking for subscriptions expiring in 2 days...");

    await emailService.checkAndSendTwoDayReminders();

    res.status(200).json({
      success: true,
      message: "2-day expiration reminders checked and sent",
    });
  } catch (error) {
    console.error("❌ Error checking 2-day expiration reminders:", error);
    return next(createHttpError(500, "Failed to check expiration reminders"));
  }
};

// Check for expired subscriptions and send notifications with due balance
export const checkExpiredSubscriptions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("🔍 Checking for expired subscriptions...");

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

    for (const userSub of expiredSubscriptions) {
      try {
        // Type guard for populated objects
        const user = userSub.user as unknown as PopulatedUser;
        const subscription = userSub.subscription as ISubscription;

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

    res.status(200).json({
      success: true,
      message: `Processed ${expiredSubscriptions.length} expired subscriptions`,
      expiredCount: expiredSubscriptions.length,
    });
  } catch (error) {
    console.error("❌ Error checking expired subscriptions:", error);
    return next(createHttpError(500, "Failed to check expired subscriptions"));
  }
};

// Get current subscription invoice
export const getCurrentInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _req = req as AuthRequest;
    const userId = _req.userId;

    console.log("🧾 Fetching current invoice for user:", userId);

    const userSubscription = (await UserSubscription.findOne({
      user: userId,
    })) as IUserSubscription | null;

    if (!userSubscription || !userSubscription.stripeCustomerId) {
      return next(createHttpError(404, "No active subscription found"));
    }

    // Get recent invoice from Stripe
    const recentInvoice = await billingService.getUpcomingInvoice(
      userSubscription.stripeCustomerId
    );

    if (!recentInvoice) {
      return next(createHttpError(404, "No invoice found"));
    }

    console.log("📄 Found recent invoice:", recentInvoice.id);

    // Handle different invoice properties safely
    const amount =
      recentInvoice.amount_due ||
      recentInvoice.amount_paid ||
      recentInvoice.total ||
      0;
    const dueDate = recentInvoice.due_date
      ? new Date(recentInvoice.due_date * 1000)
      : recentInvoice.created
      ? new Date(recentInvoice.created * 1000)
      : new Date();

    const periodStart = recentInvoice.period_start
      ? new Date(recentInvoice.period_start * 1000)
      : recentInvoice.created
      ? new Date(recentInvoice.created * 1000)
      : new Date();

    const periodEnd = recentInvoice.period_end
      ? new Date(recentInvoice.period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days from now

    res.status(200).json({
      success: true,
      invoice: {
        id: recentInvoice.id,
        amount: amount / 100, // Convert from cents
        currency: recentInvoice.currency || "usd",
        dueDate,
        periodStart,
        periodEnd,
        hostedInvoiceUrl: recentInvoice.hosted_invoice_url || null,
        invoicePdf: recentInvoice.invoice_pdf || null,
        status: recentInvoice.status || "draft",
      },
    });
  } catch (error) {
    console.error("❌ Error fetching current invoice:", error);
    return next(createHttpError(500, "Failed to fetch current invoice"));
  }
};

// Get a specific invoice by ID (for downloads/history)
export const getInvoiceById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _req = req as AuthRequest;
    const userId = _req.userId;
    const { invoiceId } = req.params as { invoiceId: string };

    if (!invoiceId) {
      return next(createHttpError(400, "Invoice ID is required"));
    }

    const userSubscription = (await UserSubscription.findOne({
      user: userId,
    })) as IUserSubscription | null;

    if (!userSubscription || !userSubscription.stripeCustomerId) {
      return next(createHttpError(404, "No active subscription found"));
    }

    const invoice = await billingService.getInvoiceById(invoiceId);
    if (!invoice) {
      return next(createHttpError(404, "Invoice not found"));
    }

    res.status(200).json({
      success: true,
      invoice: {
        id: invoice.id,
        amount:
          (invoice.amount_paid || invoice.amount_due || invoice.total || 0) /
          100,
        currency: invoice.currency || "usd",
        hostedInvoiceUrl: invoice.hosted_invoice_url || null,
        invoicePdf: invoice.invoice_pdf || null,
        status: invoice.status || "draft",
        created: invoice.created ? new Date(invoice.created * 1000) : null,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching invoice by ID:", error);
    return next(createHttpError(500, "Failed to fetch invoice"));
  }
};

// Get user subscription status with pitch usage
export const getUserSubscriptionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _req = req as AuthRequest;
    const userId = _req.userId;

    console.log("🔍 Fetching subscription status for user:", userId);

    const user = await User.findById(userId);
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    const userSubscription = (await UserSubscription.findOne({ user: userId })
      .populate("subscription")
      .populate("subscriptionPrice")) as IUserSubscription | null;

    // Count current published pitches
    const publishedPitchesCount = await Pitch.countDocuments({
      userId: userId,
      status: "published",
      isActive: true,
    });

    // Get subscription restrictions
    const subscriptionRestrictions =
      await subscriptionAccessControl.getUserSubscriptionRestrictions(userId);

    const statusData = {
      user: {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        countryName: user.countryName,
      },
      subscription: userSubscription ? userSubscription.serialize() : null,
      pitchUsage: {
        published: publishedPitchesCount,
        limit: subscriptionRestrictions.pitchLimit,
        remaining: Math.max(
          0,
          subscriptionRestrictions.pitchLimit - publishedPitchesCount
        ),
        canAddMore: publishedPitchesCount < subscriptionRestrictions.pitchLimit,
      },
      features: {
        globalVisibility: subscriptionRestrictions.globalVisibility,
        documentsAllowed: subscriptionRestrictions.documentsAllowed,
        investorAccessGlobal: subscriptionRestrictions.investorAccessGlobal,
        featuredInSearch: subscriptionRestrictions.featuredInSearch,
      },
    };

    res.status(200).json({
      success: true,
      message: "Subscription status retrieved successfully",
      data: statusData,
    });
  } catch (error) {
    console.error("❌ Error fetching subscription status:", error);
    return next(createHttpError(500, "Failed to fetch subscription status"));
  }
};

// Get cron job status
export const getCronJobStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cronJobManager } = await import("../utils/cronJobs");
    const status = cronJobManager.getJobStatus();

    res.status(200).json({
      success: true,
      jobs: status,
      totalJobs: Object.keys(status).length,
    });
  } catch (error) {
    console.error("❌ Error getting cron job status:", error);
    return next(createHttpError(500, "Failed to get cron job status"));
  }
};

// Run cron job manually (development only)
export const runCronJobManually = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (config.NODE_ENV === "production") {
      return next(
        createHttpError(403, "Manual job execution not allowed in production")
      );
    }

    const { jobName } = req.params;

    if (!jobName) {
      return next(createHttpError(400, "Job name is required"));
    }

    const { cronJobManager } = await import("../utils/cronJobs");
    await cronJobManager.runJobManually(jobName);

    res.status(200).json({
      success: true,
      message: `Job '${jobName}' executed successfully`,
      jobName,
    });
  } catch (error: unknown) {
    console.error(`❌ Error running job manually:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return next(createHttpError(500, `Failed to run job: ${errorMessage}`));
  }
};

export default {
  initializeSubscriptionPlans,
  initializeSubscriptionPlansHandler,
  getSubscriptionPlans,
  getUserSubscription,
  createCheckoutSession,
  handleSuccessfulPayment,
  cancelSubscription,
  getPaymentHistory,
  getCurrentInvoice,
  getInvoiceById,
  refreshSubscription,
  syncStripeProducts,
  checkTwoDayExpirationReminders,
  checkExpiredSubscriptions,
  getCronJobStatus,
  runCronJobManually,
  getUserSubscriptionStatus,
};
