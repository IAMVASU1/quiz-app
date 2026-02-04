// src/validators/question.validator.js
/**
 * Joi schemas for question creation/update (ESM)
 *
 * Accepts an array of choice objects: { id?, text }
 */

import { Joi } from '../utils/validator.util.js';

const choiceSchema = Joi.object({
  id: Joi.string().optional(),
  text: Joi.string().min(1).max(1000).required()
});

export const questionCreateSchema = Joi.object({
  text: Joi.string().min(1).max(5000).required(),
  choices: Joi.array().items(choiceSchema).min(2).required(),
  correctChoiceId: Joi.string().required(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').default('easy'),
  subject: Joi.string().allow(null, '').optional(),
  tags: Joi.array().items(Joi.string()).default([]),
  explanation: Joi.string().allow(null, '').optional()
});

export const questionUpdateSchema = questionCreateSchema.fork(
  ['text', 'choices', 'correctChoiceId'],
  (s) => s.optional()
);
