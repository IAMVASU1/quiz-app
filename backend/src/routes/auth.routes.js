// src/routes/auth.routes.js
/**
 * Auth routes
 * Mounted at: /api/v1/auth
 *
 * POST /register
 * POST /login
 */

import express from "express";
import * as authController from "../controllers/auth.controller.js";

const router = express.Router();

// Public endpoints
router.post("/register", authController.register);
router.post("/login", authController.login);

export default router;
