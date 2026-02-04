// src/routes/attempts.routes.js
/**
 * Attempt routes
 * Mounted at: /api/v1/attempts
 *
 * POST /start           -> start an attempt (student)
 * POST /:id/submit      -> submit answers for attempt (student)
 * GET /history          -> student's attempt history
 * GET /:id              -> get attempt by id (student own or admin/faculty)
 */

import express from "express";
import * as attemptController from "../controllers/attempt.controller.js";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const router = express.Router();

// Start attempt (student, admin, faculty)
router.post("/start", auth, role(["student", "admin", "faculty"]), attemptController.start);

// Practice attempt (student, admin, faculty)
router.post("/practice", auth, role(["student", "admin", "faculty"]), attemptController.practice);

// Submit attempt (student, admin, faculty)
router.post("/:id/submit", auth, role(["student", "admin", "faculty"]), attemptController.submit);

// History (student, admin, faculty)
router.get("/history", auth, role(["student", "admin", "faculty"]), attemptController.history);

// Get attempts by user (admin only)
router.get("/user/:userId", auth, role("admin"), attemptController.listByUser);

// Get attempts by quiz (admin/faculty)
router.get("/quiz/:quizId", auth, role(["admin", "faculty"]), attemptController.listByQuiz);

// Get attempt by id (student own; admin/faculty can view as needed)
router.get("/:id", auth, attemptController.getById);

export default router;
