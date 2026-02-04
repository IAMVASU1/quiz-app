// src/db/index.js
/**
 * MongoDB Connection Handler (Mongoose) - ES Module version
 */

import mongoose from "mongoose";

// Load MongoDB URI from environment variables
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in environment variables.");
  process.exit(1);
}

// Optional debug logs
if (process.env.MONGO_DEBUG === "true") {
  mongoose.set("debug", true);
}

/**
 * Establish the MongoDB connection
 */
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log("✅ MongoDB Connected:", mongoose.connection.host);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.log("⏳ Retrying in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

// Immediately connect
connectDB();

/**
 * Graceful shutdown
 */
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB Disconnected");
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("🔌 MongoDB connection closed due to app termination (SIGINT).");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await mongoose.connection.close();
  console.log("🔌 MongoDB connection closed due to app termination (SIGTERM).");
  process.exit(0);
});

// Export mongoose instance
export default mongoose;
