// src/index.js
/**
 * Server bootstrap — ES Module version
 */

import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
import http from "http";
import app from "./app.js";
import mongoose from "./db/index.js"; // ensure db connects automatically
import { cleanupOlderThan } from "./utils/fileCleanup.job.js";

const PORT = parseInt(process.env.PORT || "3000", 10);
const server = http.createServer(app);
import { startCleanupInterval } from "./utils/fileCleanup.job.js";

server.listen(PORT, '0.0.0.0', () => {
  console.log(
    `🚀 Server listening on 0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || "development"
    })`
  );
  console.log(`📱 Access from phone: http://10.50.84.112:${PORT}`);
});

// Graceful shutdown
const gracefulExit = async (signal) => {
  console.log(`\n🔁 Received ${signal}. Shutting down gracefully...`);

  try {
    server.close(async (err) => {
      if (err) {
        console.error("Error closing server", err);
        process.exit(1);
      }

      try {
        await mongoose.connection.close();
        console.log("✅ MongoDB connection closed.");
      } catch (dbErr) {
        console.error("Error during MongoDB disconnect", dbErr);
      }

      process.exit(0);
    });

    setTimeout(() => {
      console.warn("⚠️ Forcing shutdown after timeout.");
      process.exit(1);
    }, 10000).unref();
  } catch (e) {
    console.error("Graceful shutdown error", e);
    process.exit(1);
  }
};

process.on("SIGINT", () => gracefulExit("SIGINT"));
process.on("SIGTERM", () => gracefulExit("SIGTERM"));

// Uncaught errors
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection at Promise:", reason);
});

// File cleanup job
if ((process.env.STORAGE_DRIVER || "local") === "local") {
  const days = parseInt(process.env.CLEANUP_DAYS || "3", 10);
  const intervalMs = parseInt(
    process.env.CLEANUP_INTERVAL_MS || String(24 * 60 * 60 * 1000),
    10
  );

  console.log(
    `🧹 Starting file cleanup job: remove files older than ${days} day(s). Interval ${intervalMs}ms`
  );
  startCleanupInterval(
    Number(process.env.CLEANUP_DAYS || 3),
    Number(process.env.CLEANUP_INTERVAL_MS || 86400000)
  );

  setInterval(
    () =>
      cleanupOlderThan(days).catch((e) => console.error("Cleanup error", e)),
    intervalMs
  ).unref();
}
