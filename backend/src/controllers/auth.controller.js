// src/controllers/auth.controller.js
/**
 * Auth controller (ESM version)
 */

import bcrypt from 'bcrypt';
import User from '../models/user.model.js';
import * as jwtUtil from '../utils/jwt.util.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10', 10);

/**
 * POST /api/v1/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'name, email and password are required');
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw new ApiError(400, 'Email already registered');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Generate Avatar URL (Using Dicebear API for PNG support in React Native)
  // We request a 200px image to keep it lightweight
  const avatarUrl = `https://api.dicebear.com/9.x/adventurer/png?seed=${encodeURIComponent(email)}&size=200`;

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role: role || 'student',
    avatar: avatarUrl
  });

  const token = jwtUtil.sign({ id: user._id, role: user.role });

  res.status(201).json({
    success: true,
    message: 'User created',
    data: {
      user: user.toPublic
        ? user.toPublic()
        : { id: user._id, email: user.email, name: user.name, avatar: user.avatar },
      token,
    },
  });
});

/**
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    throw new ApiError(400, 'email and password are required');

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw new ApiError(401, 'Invalid credentials');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new ApiError(401, 'Invalid credentials');

  const token = jwtUtil.sign({ id: user._id, role: user.role });

  res.json({
    success: true,
    data: {
      token,
      user: user.toPublic ? user.toPublic() : user,
    },
  });
});
