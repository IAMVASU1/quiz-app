// src/routes/upload.routes.js
/**
 * Upload routes
 * Mounted at: /api/v1/upload
 *
 * POST /excel    -> upload an excel file (faculty/admin)
 *
 * Note: multer middleware is applied here (upload.single('file'))
 */

import express from "express";
import * as uploadController from "../controllers/upload.controller.js";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";
import upload from "../middlewares/upload.middleware.js"; // multer configured for local temp storage

const router = express.Router();

// Upload excel file (faculty or admin)
router.post(
  "/excel",
  auth,
  role(["faculty", "admin"]),
  upload.single("file"),
  uploadController.handleUpload
);

export default router;
