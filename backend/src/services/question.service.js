// src/services/question.service.js
/**
 * Question service (ESM)
 *
 * - Create/update/fetch questions
 * - List with filters (subject/difficulty)
 *
 * Exports:
 * - createQuestion
 * - updateQuestion
 * - getQuestionById
 * - listQuestions
 */

import Question from '../models/question.model.js';
import ApiError from '../utils/ApiError.js';

export async function createQuestion({ text, choices, correctChoiceId, difficulty = 'easy', subject = null, tags = [], explanation = null, createdBy = null }) {
  if (!text) throw new ApiError(400, 'text is required');
  if (!Array.isArray(choices) || choices.length < 2) throw new ApiError(400, 'At least two choices are required');
  if (!correctChoiceId) throw new ApiError(400, 'correctChoiceId is required');

  const q = await Question.create({
    text,
    choices,
    correctChoiceId,
    difficulty,
    subject,
    tags,
    explanation,
    createdBy
  });
  return q;
}

export async function updateQuestion(questionId, updater = {}, actor = null) {
  const q = await Question.findById(questionId);
  if (!q) throw new ApiError(404, 'Question not found');

  const fields = ['text', 'choices', 'correctChoiceId', 'difficulty', 'subject', 'tags', 'explanation', 'isActive'];
  let changed = false;
  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(updater, f)) {
      q[f] = updater[f];
      changed = true;
    }
  }
  if (changed) await q.save();
  return q;
}

export async function getQuestionById(id) {
  if (!id) return null;
  return Question.findById(id).lean();
}

export async function listQuestions({ subject = null, difficulty = null, isActive = true, page = 1, limit = 50 } = {}) {
  const p = Math.max(1, Number(page || 1));
  const l = Math.min(200, Math.max(1, Number(limit || 50)));
  const skip = (p - 1) * l;
  const filter = {};
  if (subject) filter.subject = subject;
  if (difficulty) filter.difficulty = difficulty;
  if (typeof isActive === 'boolean') filter.isActive = isActive;
  const [items, total] = await Promise.all([
    Question.find(filter).skip(skip).limit(l).lean(),
    Question.countDocuments(filter)
  ]);
  return { items, meta: { total, page: p, limit: l } };
}
