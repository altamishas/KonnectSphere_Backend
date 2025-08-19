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

console.log("Middleware setup complete", config.FRONTEND_URL);

// Enhanced CORS configuration with multiple allowed origins
const corsOrigins: (string | RegExp)[] = [];

// Add frontend URLs from environment variables
if (config.FRONTEND_URL) {
  // Remove trailing slash if present for consistency
  const frontendUrl = config.FRONTEND_URL.replace(/\/$/, "");
  corsOrigins.push(frontendUrl);
  console.log("✅ Added FRONTEND_URL:", frontendUrl);
}

if (config.CLIENT_URL) {
  // Remove trailing slash if present for consistency
  const clientUrl = config.CLIENT_URL.replace(/\/$/, "");
  corsOrigins.push(clientUrl);
  console.log("✅ Added CLIENT_URL:", clientUrl);
}

// Add both variations (with and without trailing slash) for safety
if (config.FRONTEND_URL) {
  corsOrigins.push(config.FRONTEND_URL);
}
if (config.CLIENT_URL) {
  corsOrigins.push(config.CLIENT_URL);
}

// Add Vercel preview deployments (for branch previews)
corsOrigins.push(/\.vercel\.app$/);

// Additional development origins (only in development)
if (process.env.NODE_ENV === "development") {
  corsOrigins.push(/https:\/\/.*\.ngrok\.io$/);
  corsOrigins.push("http://127.0.0.1:3000");
  corsOrigins.push("https://localhost:3000");
  corsOrigins.push("https://127.0.0.1:3000");
}

// Debug logging for CORS setup
console.log("🌐 CORS Configuration:", {
  nodeEnv: process.env.NODE_ENV,
  frontendUrl: config.FRONTEND_URL,
  corsOrigins: corsOrigins.map((origin) =>
    origin instanceof RegExp ? origin.toString() : origin
  ),
});

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, or curl requests)
      if (!origin) {
        console.log("✅ CORS: Allowing request with no origin");
        return callback(null, true);
      }

      console.log("🔍 CORS: Checking origin:", origin);

      // Check if origin matches our allowed patterns
      const isAllowed = corsOrigins.some((allowedOrigin) => {
        if (allowedOrigin instanceof RegExp) {
          const match = allowedOrigin.test(origin);
          if (match)
            console.log(
              "✅ CORS: Origin matched regex:",
              allowedOrigin.toString()
            );
          return match;
        }

        if (typeof allowedOrigin === "string") {
          if (allowedOrigin.includes("*")) {
            const pattern = allowedOrigin.replace(/\*/g, ".*");
            const regex = new RegExp(`^${pattern}$`);
            const match = regex.test(origin);
            if (match)
              console.log("✅ CORS: Origin matched wildcard:", allowedOrigin);
            return match;
          }
          const match = allowedOrigin === origin;
          if (match)
            console.log("✅ CORS: Origin matched exactly:", allowedOrigin);
          return match;
        }

        return false;
      });

      if (isAllowed) {
        console.log("✅ CORS: Origin allowed:", origin);
        callback(null, true);
      } else {
        console.log("🚫 CORS: Origin blocked:", origin);
        console.log("🚫 CORS: Allowed origins:", corsOrigins);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "stripe-signature",
      "Cookie",
      "Set-Cookie",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Set-Cookie"],
    credentials: true, // This is crucial for cookies to work
    optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  })
);

// Add a middleware to log requests for debugging
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    console.log("📝 Request:", {
      method: req.method,
      path: req.path,
      origin: req.get("origin"),
      userAgent: req.get("user-agent")?.slice(0, 50),
      hasCookies: !!req.headers.cookie,
      cookies: req.headers.cookie ? Object.keys(req.cookies) : [],
    });
    next();
  });
}

app.get("/", (req, res) => {
  res.json({
    message: "Backend Server is responding",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    frontendUrl: config.FRONTEND_URL,
    allowedOrigins: corsOrigins.map((origin) =>
      origin instanceof RegExp ? origin.toString() : origin
    ),
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
