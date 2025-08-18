import express from "express";
import cors from "cors";
import GlobalErrorHandler from "./middlewares/GlobalErrorHandler";
import userRouter from "./user/userRouter";
import enterpreneurRouter from "./Enterpreneur/enterpreneurRouter";
import pitchRouter from "./pitch/pitchRouter";
import investorRouter from "./investor/investorRouter";
import contactRouter from "./contact/contactRouter";
import subscriptionRouter from "./subscription/subscriptionRouter";
import webhookRouter from "./subscription/webhookRouter";
import chatRouter from "./chat/chatRouter";
import favouritesRouter from "./favourites/favouritesRouter";
import { config } from "./config/config";
import cookieParser from "cookie-parser";
import connectDB from "./config/databaseConection";
import {
  initializeSubscriptionPlans,
  syncStripeProducts,
} from "./subscription/subscriptionController";

// Initialize database and subscriptions
(async () => {
  try {
    await connectDB();
    await initializeSubscriptionPlans();
    await syncStripeProducts();

    // Initialize cron jobs for scheduled tasks
    if (config.NODE_ENV === "production") {
      console.log("🚀 Production mode: Initializing cron jobs...");
      const { cronJobManager } = await import("./utils/cronJobs");
      cronJobManager.initializeJobs();
      cronJobManager.startJobs();
    } else {
      console.log("🔧 Development mode: Cron jobs available via API endpoints");
      console.log(
        "📅 Use POST /api/subscriptions/cron-run/{jobName} to test manually"
      );
    }
  } catch (error) {
    console.error("Initialization error:", error);
    process.exit(1);
  }
})();

const app = express();

// Webhook routes must come before express.json() middleware
app.use("/api/webhooks", webhookRouter);

app.use(express.json());
app.use(cookieParser());

// CORS configuration for development and production
const corsOrigins = [config.FRONTEND_URL as string];

// Add ngrok domains for development
if (process.env.NODE_ENV === "development") {
  corsOrigins.push("https://*.ngrok.io");
  corsOrigins.push("http://localhost:3000");
  corsOrigins.push("http://127.0.0.1:3000");
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Check if origin matches our allowed patterns
      const isAllowed = corsOrigins.some((allowedOrigin) => {
        if (allowedOrigin.includes("*")) {
          // Handle wildcard patterns like *.ngrok.io
          const pattern = allowedOrigin.replace("*", ".*");
          return new RegExp(pattern).test(origin);
        }
        return allowedOrigin === origin;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        console.log("🚫 CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.json({ message: "Backend Server is responding" });
});

app.use("/api/users", userRouter);
app.use("/api/enterpreneur", enterpreneurRouter);
app.use("/api/pitches", pitchRouter);
app.use("/api/investors", investorRouter);
app.use("/api/contact", contactRouter);
app.use("/api/subscriptions", subscriptionRouter);
app.use("/api/chat", chatRouter);
app.use("/api/favourites", favouritesRouter);
app.use(GlobalErrorHandler);

export default app;
