// src/validators/quiz.validator.js
/**
 * Joi schemas for quiz create/update (ESM)
 *
 * - quizCreateSchema: title, description, type, settings, questionIds, builtInFilter
 * - quizUpdateSchema: same but all optional
 */

import { Joi } from '../utils/validator.util.js';

const settingsSchema = Joi.object({
  shuffleQuestions: Joi.boolean().default(true),
  questionsCount: Joi.number().integer().min(1).default(10),
  allowMultipleAttempts: Joi.boolean().default(true)
}).default();

const builtInFilterSchema = Joi.object({
  category: Joi.string().valid('aptitude', 'technical').default('aptitude'),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').allow(null),
  subjects: Joi.array().items(Joi.string()).default([])
}).default();

export const quizCreateSchema = Joi.object({
  title: Joi.string().min(1).max(300).required(),
  description: Joi.string().allow('', null).optional(),
  type: Joi.string().valid('custom', 'built-in').default('custom'),
  settings: settingsSchema,
  questionIds: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).default([]),
  builtInFilter: builtInFilterSchema
});

export const quizUpdateSchema = quizCreateSchema.fork(
  ['title', 'type', 'questionIds'],
  (s) => s.optional()
);
