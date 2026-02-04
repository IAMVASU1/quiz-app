// src/routes/admin.routes.js
/**
 * Admin routes
 * Mounted at: /api/v1/admin
 *
 * GET /stats  -> get dashboard statistics
 */

import express from "express";
import * as adminController from "../controllers/admin.controller.js";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const router = express.Router();

// Admin-only routes
router.get("/stats", auth, role("admin"), adminController.getStats);
router.get("/stats/trend", auth, role("admin"), adminController.getAttemptTrend);

export default router;
