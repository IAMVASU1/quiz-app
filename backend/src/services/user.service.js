// src/services/user.service.js
/**
 * User service (ESM)
 * Encapsulates user-related DB operations.
 *
 * Exports:
 * - createUser
 * - findById
 * - findByEmail
 * - updateUser
 * - listUsers
 */

import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';

export async function createUser({ name, email, passwordHash, role = 'student', subjects = [], metadata = {} }) {
  // basic duplication check
  const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (existing) {
    throw new ApiError(400, 'Email already registered');
  }
  const user = await User.create({
    name: String(name).trim(),
    email: String(email).toLowerCase().trim(),
    passwordHash,
    role,
    subjects,
    metadata
  });
  return user;
}

export async function findById(id) {
  if (!id) return null;
  return User.findById(id).select('-passwordHash').lean();
}

export async function findByEmail(email) {
  if (!email) return null;
  return User.findOne({ email: String(email).toLowerCase().trim() }).lean();
}

export async function updateUser(id, updateObj = {}) {
  if (!id) throw new ApiError(400, 'id required');
  const allowed = ['name', 'subjects', 'metadata', 'role', 'totalScore', 'email'];
  const u = {};
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(updateObj, k)) u[k] = updateObj[k];
  }
  const updated = await User.findByIdAndUpdate(id, u, { new: true }).select('-passwordHash');
  if (!updated) throw new ApiError(404, 'User not found');
  return updated;
}

export async function listUsers({ page = 1, limit = 50 } = {}) {
  const p = Math.max(1, Number(page || 1));
  const l = Math.min(200, Math.max(1, Number(limit || 50)));
  const skip = (p - 1) * l;
  const [items, total] = await Promise.all([
    User.find().select('-passwordHash').skip(skip).limit(l).lean(),
    User.countDocuments()
  ]);
  return { items, meta: { total, page: p, limit: l } };
}
