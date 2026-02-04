// src/routes/leaderboard.routes.js
/**
 * Leaderboard routes (ESM)
 *
 * - GET /api/v1/leaderboard/top?limit=10
 * - GET /api/v1/leaderboard/:id  (student profile)
 */

import express from 'express';
import { getTop, getStudentProfile } from '../controllers/leaderboard.controller.js';
import auth from '../middlewares/auth.middleware.js'; // ESM version expected

const router = express.Router();

// Public top leaderboard (no auth required) — optional: require auth if you want
router.get('/top', getTop);

// Student profile requires auth (or make public)
router.get('/:id', auth, getStudentProfile);

export default router;
