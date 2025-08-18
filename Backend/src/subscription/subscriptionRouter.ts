import express from "express";
import { body, validationResult } from "express-validator";
import tokenVerification from "../middlewares/tokenVerification";
import { asyncHandler } from "../middlewares/asyncHandler";
import subscriptionController, {
  initializeSubscriptionPlansHandler,
} from "./subscriptionController";

// Validation error handler middleware
const handleValidationErrors = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    const message = firstError.msg || "Invalid input provided";

    res.status(400).json({
      success: false,
      message,
      field:
        (firstError as { path?: string; param?: string }).path ||
        (firstError as { path?: string; param?: string }).param ||
        "unknown",
      errors: errors.array(),
    });
    return;
  }
  next();
};

const subscriptionRouter = express.Router();

// Public routes
subscriptionRouter.get(
  "/plans",
  asyncHandler(subscriptionController.getSubscriptionPlans)
);
subscriptionRouter.post(
  "/initialize",
  asyncHandler(initializeSubscriptionPlansHandler)
);
// Protected routes (require authentication)
// Get user's current subscription
subscriptionRouter.get(
  "/current",
  tokenVerification,
  asyncHandler(subscriptionController.getUserSubscription)
);

// Get subscription status with pitch usage
subscriptionRouter.get(
  "/status",
  tokenVerification,
  asyncHandler(subscriptionController.getUserSubscriptionStatus)
);

// Create checkout session for subscription
subscriptionRouter.post(
  "/checkout",
  tokenVerification,

  asyncHandler(subscriptionController.createCheckoutSession)
);

// Handle successful payment (no auth required as validation is done via Stripe session)
subscriptionRouter.post(
  "/success",
  [
    body("sessionId")
      .notEmpty()
      .withMessage("Session ID is required")
      .isString()
      .withMessage("Session ID must be a string"),
  ],
  handleValidationErrors,
  asyncHandler(subscriptionController.handleSuccessfulPayment)
);

// Cancel subscription
subscriptionRouter.post(
  "/cancel",
  tokenVerification,
  [
    body("reason").optional().isString().withMessage("Reason must be a string"),
    body("feedback")
      .optional()
      .isString()
      .withMessage("Feedback must be a string"),
    body("immediate")
      .optional()
      .isBoolean()
      .withMessage("Immediate must be a boolean"),
  ],
  handleValidationErrors,
  asyncHandler(subscriptionController.cancelSubscription)
);

// Refresh subscription from Stripe
subscriptionRouter.post(
  "/refresh",
  tokenVerification,
  asyncHandler(subscriptionController.refreshSubscription)
);

// Get payment history
subscriptionRouter.get(
  "/payments",
  tokenVerification,
  asyncHandler(subscriptionController.getPaymentHistory)
);

// Get current invoice
subscriptionRouter.get(
  "/current-invoice",
  tokenVerification,
  asyncHandler(subscriptionController.getCurrentInvoice)
);

// Get invoice by ID
subscriptionRouter.get(
  "/invoices/:invoiceId",
  tokenVerification,
  asyncHandler(subscriptionController.getInvoiceById)
);

// Email reminder and expiration check routes (for admin/cron jobs)
subscriptionRouter.post(
  "/check-two-day-reminders",
  asyncHandler(subscriptionController.checkTwoDayExpirationReminders)
);

subscriptionRouter.post(
  "/check-expired-subscriptions",
  asyncHandler(subscriptionController.checkExpiredSubscriptions)
);

// Cron job management routes (development only)
subscriptionRouter.get(
  "/cron-status",
  asyncHandler(subscriptionController.getCronJobStatus)
);

subscriptionRouter.post(
  "/cron-run/:jobName",
  asyncHandler(subscriptionController.runCronJobManually)
);

// Alias route to match testing guide (development only)
subscriptionRouter.post(
  "/test-cron/:jobName",
  asyncHandler(subscriptionController.runCronJobManually)
);

export default subscriptionRouter;
