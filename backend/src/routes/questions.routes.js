// src/routes/questions.routes.js
/**
 * Question routes
 * Mounted at: /api/v1/questions
 *
 * POST /          -> create a question (faculty/admin)
 * GET /           -> list questions with filters
 * GET /:id        -> get question by id
 * PUT /:id        -> update question (faculty owner or admin)
 * DELETE /:id     -> soft-delete (faculty owner or admin)
 */

import express from "express";
import * as questionController from "../controllers/question.controller.js";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const router = express.Router();

// Create question (faculty/admin)
router.post("/", auth, role(["faculty", "admin"]), questionController.create);

// Get subjects (public/auth)
router.get("/subjects", auth, questionController.getSubjects);

// Count by Creator
router.get("/count/creator/:userId", auth, questionController.countByCreator);

// List / filter
router.get("/", auth, questionController.list);

// Get by ID
router.get("/:id", auth, questionController.getById);

// Update
router.put("/:id", auth, questionController.update);

// Soft-delete / archive
router.delete("/:id", auth, questionController.remove);

import multer from "multer";
import { bulkUploadQuestions } from "../controllers/upload.controller.js";

const upload = multer({ dest: "uploads/" });

// Bulk upload (faculty/admin)
router.post("/bulk-upload", auth, role(["faculty", "admin"]), upload.single("file"), bulkUploadQuestions);

export default router;
