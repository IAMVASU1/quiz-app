// src/controllers/leaderboard.controller.js
/**
 * Leaderboard controller
// src/controllers/leaderboard.controller.js
/**
 * Leaderboard controller
 *
 * - getTop: returns top N students by totalScore (default 10)
 * - getStudentProfile: returns student's public profile + accuracy
 */

import User from '../models/user.model.js';
import Attempt from '../models/attempt.model.js';
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

export const getTop = asyncHandler(async (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
  // Only students in leaderboard
  const top = await User.find({ role: 'student' })
    .sort({ totalScore: -1, createdAt: 1 })
    .limit(limit)
    .select('name totalScore totalCorrectAnswers totalQuestionsAnswered')
    .lean();

  // Add accuracy to each item (might be null)
  const items = top.map((u) => ({
    id: u._id,
    name: u.name,
    totalScore: u.totalScore || 0,
    totalCorrectAnswers: u.totalCorrectAnswers || 0,
    totalQuestionsAnswered: u.totalQuestionsAnswered || 0,
    accuracy:
      u.totalQuestionsAnswered && u.totalQuestionsAnswered > 0
        ? Math.round((u.totalCorrectAnswers / u.totalQuestionsAnswered) * 10000) / 100
        : null
  }));

  res.json({ success: true, data: { items } });
});

export const getStudentProfile = asyncHandler(async (req, res) => {
  console.log("getStudentProfile called for ID:", req.params.id);
  try {
    const id = req.params.id;
    if (!id) throw new ApiError(400, 'student id required');

    console.log("Finding user...");
    const user = await User.findById(id).select('-passwordHash').lean();
    if (!user) {
      console.log("User not found");
      throw new ApiError(404, 'User not found');
    }
    console.log("User found:", user.email);

    // Calculate rank
    // Calculate rank
    // Rank = (count of students with higher score) + (count of students with same score but earlier registration) + 1
    const rank = await User.countDocuments({
      role: 'student',
      $or: [
        { totalScore: { $gt: user.totalScore || 0 } },
        { totalScore: user.totalScore || 0, createdAt: { $lt: user.createdAt } }
      ]
    }) + 1;

    const attemptsCount = await Attempt.countDocuments({ userId: user._id });

    const profile = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      totalScore: user.totalScore || 0,
      totalCorrectAnswers: user.totalCorrectAnswers || 0,
      totalQuestionsAnswered: user.totalQuestionsAnswered || 0,
      accuracy:
        user.totalQuestionsAnswered && user.totalQuestionsAnswered > 0
          ? Math.round((user.totalCorrectAnswers / user.totalQuestionsAnswered) * 10000) / 100
          : null,
      rank,
      attempts: attemptsCount,
      metadata: user.metadata || {}
    };

    console.log("Sending response...");
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error("Error in getStudentProfile:", error);
    throw error;
  }
});
