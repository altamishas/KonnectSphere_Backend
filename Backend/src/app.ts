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

// Fix 304 caching issues in production
app.use((req, res, next) => {
  // Disable caching for API routes in production
  if (req.path.startsWith("/api/")) {
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      ETag: false,
    });
  }
  next();
});

// CORS configuration for development and production
const corsOrigins = [config.FRONTEND_URL as string];

// Debug logging for environment variables
console.log("🔧 Environment Configuration:");
console.log("NODE_ENV:", config.NODE_ENV);
console.log("FRONTEND_URL:", config.FRONTEND_URL);
console.log("Configured CORS origins:", corsOrigins);

// Add ngrok domains for development
if (process.env.NODE_ENV === "development") {
  corsOrigins.push("https://*.ngrok.io");
  corsOrigins.push("http://localhost:3000");
  corsOrigins.push("http://127.0.0.1:3000");
}

// Add additional allowed origins for production (as fallback)
if (process.env.NODE_ENV === "production") {
  // Add all possible Vercel patterns for your project
  corsOrigins.push("https://konnectsphere.vercel.app");
  corsOrigins.push("https://konect-sphere.vercel.app"); // Alternative spelling
  corsOrigins.push("https://konect-sphere.vercel.app"); // Alternative spelling
  corsOrigins.push("https://*.vercel.app"); // All Vercel preview deployments
  corsOrigins.push("https://*-muhammad-muzzammils-projects-*.vercel.app"); // Your preview deployments
}

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("🌐 CORS Request from origin:", origin);
      console.log("🔍 Available CORS origins:", corsOrigins);

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log("✅ Allowing request with no origin");
        return callback(null, true);
      }

      // Check if origin matches our allowed patterns
      let isAllowed = corsOrigins.some((allowedOrigin) => {
        if (!allowedOrigin) return false; // Skip undefined/null values

        if (allowedOrigin.includes("*")) {
          // Handle wildcard patterns like *.vercel.app
          const pattern = allowedOrigin
            .replace(/\./g, "\\.") // Escape dots
            .replace(/\*/g, ".*"); // * matches any characters
          const regex = new RegExp(`^${pattern}$`);
          const matches = regex.test(origin);
          console.log(
            `🔍 Testing wildcard ${allowedOrigin} -> ${pattern} against ${origin}: ${matches}`
          );
          return matches;
        }
        const matches = allowedOrigin === origin;
        console.log(
          `🔍 Testing exact match ${allowedOrigin} against ${origin}: ${matches}`
        );
        return matches;
      });

      // Special handling for Vercel deployments (as backup)
      if (!isAllowed && origin?.includes(".vercel.app")) {
        // Allow any Vercel deployment that contains your project keywords
        const projectKeywords = ["konnect", "sphere", "muhammad-muzzammil"];
        const hasProjectKeyword = projectKeywords.some((keyword) =>
          origin.toLowerCase().includes(keyword.toLowerCase())
        );

        if (hasProjectKeyword) {
          console.log(
            `✅ Allowing Vercel deployment with project keyword: ${origin}`
          );
          isAllowed = true;
        }
      }

      if (isAllowed) {
        console.log("✅ CORS allowing origin:", origin);
        callback(null, true);
      } else {
        console.log("🚫 CORS blocked origin:", origin);
        console.log("🚫 Origin not in allowed list:", corsOrigins);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "stripe-signature",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    credentials: true,
    optionsSuccessStatus: 200, // For legacy browser support
    preflightContinue: false, // Pass control to next handler
  })
);

app.get("/", (req, res) => {
  res.json({ message: "Backend Server is responding" });
});

// Temporary debug endpoint - remove after fixing CORS issue
app.get("/debug/cors", (req, res) => {
  res.json({
    message: "CORS Debug Information",
    environment: {
      NODE_ENV: config.NODE_ENV,
      FRONTEND_URL: config.FRONTEND_URL,
    },
    corsOrigins: corsOrigins,
    timestamp: new Date().toISOString(),
  });
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
