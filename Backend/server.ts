import { config } from "./src/config/config";
import app from "./src/app";
import { createServer } from "http";
import { initializeSocket } from "./src/socket/socketHandler";
import { cronJobManager } from "./src/utils/cronJobs";

const StartServer = async () => {
  try {
    const PORT = config.PORT || 3000;

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.IO
    initializeSocket(httpServer);

    // Initialize and start cron jobs
    cronJobManager.initializeJobs();
    cronJobManager.startJobs();
    console.log("✅ Cron jobs initialized and started");

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${config.NODE_ENV}`);
      console.log(`Cron job status:`, cronJobManager.getJobStatus());
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

StartServer();
