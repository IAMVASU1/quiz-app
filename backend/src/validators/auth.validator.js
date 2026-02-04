// src/validators/auth.validator.js
/**
 * Joi schemas for auth endpoints (ESM)
 *
 * - registerSchema: name, email, password, optional role
 * - loginSchema: email, password
 */

import { Joi } from '../utils/validator.util.js'; // ESM import

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  email: Joi.string().email().max(320).required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid('student', 'faculty', 'admin').optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().max(320).required(),
  password: Joi.string().min(6).max(128).required()
});
