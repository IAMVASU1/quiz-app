// src/controllers/quiz.controller.js
/**
 * Quiz Controller (ESM)
 * Handles:
 *  - Manual quiz creation
 *  - Excel-based quiz creation (random sampling)
 *  - Built-in quiz generation (subject/category-based)
 */

import * as QuizService from "../services/quiz.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

/**
 * POST /api/v1/quizzes
 * Faculty/Admin create quiz
 *
 * Supports:
 * - Manual: questionIds[]
 * - Excel upload: req.file + questionsCount
 * - Built-in: type='built-in' + builtInFilter + questionsCount
 */
export const create = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user || (user.role !== "faculty" && user.role !== "admin")) {
    throw new ApiError(403, "Only faculty or admin can create quizzes");
  }

  const {
    title,
    description = null,
    type = "custom",
    settings = {},
    questionIds = [],
    builtInFilter = {},
  } = req.body;

  if (!title) throw new ApiError(400, "title is required");

  // Convert possible JSON strings (e.g., sent from form-data)
  let parsedBuiltInFilter = builtInFilter;
  if (typeof builtInFilter === "string") {
    try {
      parsedBuiltInFilter = JSON.parse(builtInFilter);
    } catch {
      throw new ApiError(400, "Invalid builtInFilter JSON");
    }
  }

  const questionsCount = req.body.questionsCount
    ? parseInt(req.body.questionsCount, 10)
    : null;

  // ---------------------------------------------------------
  // CASE 1: EXCEL UPLOAD
  // ---------------------------------------------------------
  if (req.file) {
    const filePath = req.file.path;

    const result = await QuizService.createFromExcel({
      title,
      description,
      createdBy: user.id,
      filePath,
      questionsCount,
      settings,
    });

    return res.status(201).json({ success: true, data: result });
  }

  // ---------------------------------------------------------
  // CASE 2: BUILT-IN QUIZ CREATION
  // ---------------------------------------------------------
  if (type === "built-in") {
    const result = await QuizService.createBuiltInQuiz({
      title,
      description,
      createdBy: user.id,
      builtInFilter: parsedBuiltInFilter,
      questionsCount,
      settings,
    });

    return res.status(201).json({ success: true, data: result });
  }

  // ---------------------------------------------------------
  // CASE 3: MANUAL QUIZ CREATION
  // ---------------------------------------------------------
  const quiz = await QuizService.createQuiz({
    title,
    description,
    createdBy: user.id,
    questionIds,
    settings,
  });

  return res.status(201).json({ success: true, data: quiz });
});

/**
 * GET /api/v1/quizzes
 */
export const list = asyncHandler(async (req, res) => {
  const user = req.user;

  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(200, Math.max(10, parseInt(req.query.limit || "50", 10)));

  console.log(`List Quizzes - User: ${user.id}, Role: ${user.role}`);

  const showAll = req.query.all === 'true' && user.role === 'admin';

  const result = await QuizService.listQuizzes({
    ownerId: showAll ? null : user.id,
    page,
    limit,
  });

  res.json({ success: true, data: result });
});

/**
 * GET /api/v1/quizzes/:id
 */
export const getById = asyncHandler(async (req, res) => {
  const quiz = await QuizService.getQuizById(req.params.id, {
    populateQuestions: true,
  });

  if (!quiz) throw new ApiError(404, "Quiz not found");

  res.json({ success: true, data: quiz });
});

/**
 * PUT /api/v1/quizzes/:id
 */
export const update = asyncHandler(async (req, res) => {
  const user = req.user;
  const result = await QuizService.updateQuiz(req.params.id, req.body, user);

  res.json({ success: true, data: result });
});

/**
 * DELETE /api/v1/quizzes/:id
 */
export const remove = asyncHandler(async (req, res) => {
  await QuizService.deleteQuiz(req.params.id);
  res.json({ success: true, message: "Quiz deleted" });
});

/**
 * GET /api/v1/quizzes/by-code/:code
 */
export const getByCode = asyncHandler(async (req, res) => {
  const quiz = await QuizService.getQuizByCode(req.params.code);
  if (!quiz) throw new ApiError(404, "Quiz not found");
  if (quiz.status !== "published") {
    throw new ApiError(403, "Quiz not open for joining");
  }

  res.json({ success: true, data: quiz });
});

/**
 * GET /api/v1/quizzes/creator/:userId
 * Admin/Faculty only: Get quizzes created by a specific user
 */
export const getByCreator = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = req.user;

  if (user.role !== 'admin' && user.role !== 'faculty') {
    throw new ApiError(403, 'Not authorized');
  }

  // If faculty, can only view their own quizzes (though frontend might restrict this, backend should too unless admin)
  if (user.role === 'faculty' && String(user.id) !== String(userId)) {
    throw new ApiError(403, 'Can only view your own quizzes');
  }

  const quizzes = await QuizService.listQuizzes({
    ownerId: userId,
    page: 1,
    limit: 1000 // Fetch all for now
  });

  res.json({ success: true, data: quizzes });
});
