// src/app.js
/**
 * Express app setup — ES Module version
 */

import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import helmet from "helmet";
import { fileURLToPath } from "url";

// Convert __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";
import quizRoutes from "./routes/quizzes.routes.js";
import questionRoutes from "./routes/questions.routes.js";
import attemptRoutes from "./routes/attempts.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import leaderboardRoutes from './routes/leaderboard.routes.js';
import adminRoutes from './routes/admin.routes.js';

// Middlewares
import errorHandler from "./middlewares/error.middleware.js";

const app = express();

app.use(helmet());

app.use(cors({
  origin: "*",   // allow all (safe for testing)
  credentials: true
}));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("tiny"));
}

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Static files
const publicDir = path.join(__dirname, "public");
app.use("/public", express.static(publicDir));

const apiPrefix = process.env.API_PREFIX || "/api/v1";

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/quizzes`, quizRoutes);
app.use(`${apiPrefix}/questions`, questionRoutes);
app.use(`${apiPrefix}/attempts`, attemptRoutes);
app.use(`${apiPrefix}/upload`, uploadRoutes);
app.use(`${apiPrefix}/leaderboard`, leaderboardRoutes);
app.use(`${apiPrefix}/admin`, adminRoutes);

// Healthcheck
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Not Found" });
});

// Central error handler
app.use(errorHandler);

export default app;
