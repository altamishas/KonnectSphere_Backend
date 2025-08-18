import express from "express";
import webhookController from "./webhookController";

const webhookRouter = express.Router();

// Stripe webhook endpoint - requires raw body
webhookRouter.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  webhookController.handleStripeWebhook
);

export default webhookRouter;
