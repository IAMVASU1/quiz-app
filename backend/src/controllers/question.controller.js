// src/controllers/question.controller.js
/**
 * Question controller (ESM)
 */

import Question from '../models/question.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

/**
 * POST /api/v1/questions
 * Create a question (faculty/admin)
 */

// don't check if ques already exists in db
// export const create = asyncHandler(async (req, res) => {
//   const user = req.user;
//   if (!user || (user.role !== 'faculty' && user.role !== 'admin')) {
//     throw new ApiError(403, 'Only faculty or admin can create questions');
//   }

//   const {
//     text,
//     choices,
//     correctChoiceId,
//     difficulty = 'easy',
//     subject = null,
//     tags = [],
//     explanation = null,
//   } = req.body;

//   if (!text || !choices || !correctChoiceId) {
//     throw new ApiError(400, 'text, choices and correctChoiceId are required');
//   }

//   const q = await Question.create({
//     text,
//     choices,
//     correctChoiceId,
//     difficulty,
//     subject,
//     tags,
//     explanation,
//     createdBy: user.id,
//   });

//   res.status(201).json({ success: true, data: q });
// });


// check if ques already exists in db
export const create = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user || (user.role !== 'faculty' && user.role !== 'admin')) {
    throw new ApiError(403, 'Only faculty or admin can create questions');
  }

  const {
    text,
    choices,
    correctChoiceId,
    difficulty = 'easy',
    subject = null,
    tags = [],
    explanation = null,
  } = req.body;

  if (!text || !choices || !correctChoiceId) {
    throw new ApiError(400, 'text, choices and correctChoiceId are required');
  }

  // Check for duplicates: same text + same choices (ignoring order)
  const existing = await Question.findOne({
    text: text.trim(),
    'choices.text': { $all: choices.map(c => c.text.trim()) },
    choices: { $size: choices.length },
  });

  if (existing) {
    return res.status(200).json({
      success: true,
      message: 'Question already exists (skipped creation)',
      data: existing,
    });
  }

  const q = await Question.create({
    text,
    choices,
    correctChoiceId,
    difficulty,
    subject,
    tags,
    explanation,
    createdBy: user.id,
  });

  res.status(201).json({ success: true, data: q });
});


/**
 * GET /api/v1/questions
 * List questions with filters
 */
export const list = asyncHandler(async (req, res) => {
  const q = {};
  if (req.query.subject) q.subject = req.query.subject;
  if (req.query.difficulty) q.difficulty = req.query.difficulty;
  if (req.query.isActive) q.isActive = req.query.isActive === 'true';
  if (req.query.search) {
    q.text = { $regex: req.query.search, $options: 'i' };
  }

  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(
    200,
    Math.max(10, parseInt(req.query.limit || '50', 10))
  );
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Question.find(q).skip(skip).limit(limit).lean(),
    Question.countDocuments(q),
  ]);

  res.json({
    success: true,
    data: { items, meta: { total, page, limit } },
  });
});

/**
 * GET /api/v1/questions/:id
 */
export const getById = asyncHandler(async (req, res) => {
  const q = await Question.findById(req.params.id).lean();
  if (!q) throw new ApiError(404, 'Question not found');
  res.json({ success: true, data: q });
});

/**
 * PUT /api/v1/questions/:id
 * Faculty: edit own
 * Admin: edit any
 */
export const update = asyncHandler(async (req, res) => {
  const user = req.user;
  const q = await Question.findById(req.params.id);
  if (!q) throw new ApiError(404, 'Question not found');

  if (user.role === 'faculty' && String(q.createdBy) !== String(user.id)) {
    throw new ApiError(403, 'Not allowed to edit this question');
  }

  const updatable = [
    'text',
    'choices',
    'correctChoiceId',
    'difficulty',
    'subject',
    'tags',
    'explanation',
    'isActive',
  ];

  updatable.forEach((k) => {
    if (req.body[k] !== undefined) q[k] = req.body[k];
  });

  await q.save();
  res.json({ success: true, data: q });
});

/**
 * DELETE /api/v1/questions/:id
 */
export const remove = asyncHandler(async (req, res) => {
  const user = req.user;
  const q = await Question.findById(req.params.id);
  if (!q) throw new ApiError(404, 'Question not found');

  if (user.role === 'faculty' && String(q.createdBy) !== String(user.id)) {
    throw new ApiError(403, 'Not allowed to remove this question');
  }

  q.isActive = false;
  await q.save();

  res.json({ success: true, message: 'Question archived' });
});

/**
 * GET /api/v1/questions/subjects
 * Get list of available subjects from BuiltInPool
 */
export const getSubjects = asyncHandler(async (req, res) => {
  const BuiltInPool = await import('../models/builtinPool.model.js').then(m => m.default);

  const [builtInSubjects, customSubjects] = await Promise.all([
    BuiltInPool.distinct('subject'),
    Question.distinct('subject')
  ]);

  const allSubjects = [...new Set([...builtInSubjects, ...customSubjects])].filter(s => s);
  res.json({ success: true, data: allSubjects.sort() });
});

/**
 * GET /api/v1/questions/count/creator/:userId
 * Count questions created by specific user
 */
export const countByCreator = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const count = await Question.countDocuments({ createdBy: userId });
  res.json({ success: true, data: count });
});
