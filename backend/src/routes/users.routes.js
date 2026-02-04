// src/routes/users.routes.js
/**
 * User routes
 * Mounted at: /api/v1/users
 *
 * GET /me              -> current user's profile
 * GET /                -> admin: list users
 * PUT /:id             -> admin: update user (role/metadata)
 */

import express from "express";
import * as userController from "../controllers/user.controller.js";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const router = express.Router();

// Get current user's profile
router.get("/me", auth, userController.me);

// Admin-only routes
router.get("/", auth, role("admin"), userController.list);
router.put("/:id", auth, role("admin"), userController.update);
router.delete("/:id", auth, role("admin"), userController.deleteUser);

export default router;
