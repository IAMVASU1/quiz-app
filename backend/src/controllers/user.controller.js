// src/controllers/user.controller.js
/**
 * User controller (ESM)
 * - get current user profile
 * - admin: list users, update user role or metadata
 *
 * Routes expected:
 * - GET /api/v1/users/me
 * - GET /api/v1/users      (admin)
 * - PUT /api/v1/users/:id  (admin update role/metadata)
 */

import User from '../models/user.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

/**
 * GET /api/v1/users/me
 */
export const me = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) throw new ApiError(401, 'Not authenticated');

  const user = await User.findById(req.user.id).select('-passwordHash');
  if (!user) throw new ApiError(404, 'User not found');

  res.json({ success: true, data: user.toPublic ? user.toPublic() : user });
});

/**
 * GET /api/v1/users
 * Admin only: list users (with pagination)
 * Query: ?page=1&limit=50
 */
export const list = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'admin') throw new ApiError(403, 'Admin only');

  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(200, Math.max(10, parseInt(req.query.limit || '50', 10)));
  const skip = (page - 1) * limit;

  const [usersDocs, total] = await Promise.all([
    User.find().select('-passwordHash').skip(skip).limit(limit),
    User.countDocuments()
  ]);

  const users = usersDocs.map(u => u.toPublic ? u.toPublic() : u);

  res.json({
    success: true,
    data: { users, meta: { total, page, limit } }
  });
});

/**
 * PUT /api/v1/users/:id
 * Admin only: update role or metadata
 * Body: { role?, metadata?, name? }
 */
export const update = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'admin') throw new ApiError(403, 'Admin only');

  const { id } = req.params;
  const { role, metadata, name } = req.body;

  const update = {};
  if (role) update.role = role;
  if (metadata) update.metadata = metadata;
  if (name) update.name = name;

  const user = await User.findByIdAndUpdate(id, update, { new: true }).select('-passwordHash');
  if (!user) throw new ApiError(404, 'User not found');

  res.json({ success: true, data: user });
});

/**
 * DELETE /api/v1/users/:id
 * Admin only: delete user
 */
export const deleteUser = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'admin') throw new ApiError(403, 'Admin only');

  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);

  if (!user) throw new ApiError(404, 'User not found');

  res.json({ success: true, message: 'User deleted successfully' });
});
