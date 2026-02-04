// src/middlewares/auth.middleware.js
/**
 * Auth middleware (ESM)
 */

import ApiError from '../utils/ApiError.js';
import { verify } from '../utils/jwt.util.js';
import asyncHandler from '../utils/asyncHandler.js';

export default asyncHandler(async (req, res, next) => {
  const authHeader =
    req.headers.authorization || req.headers.Authorization || '';

  if (!authHeader) {
    throw new ApiError(401, 'Authorization header missing');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new ApiError(
      401,
      'Invalid Authorization header format. Expected "Bearer <token>".'
    );
  }

  const token = parts[1];

  try {
    const payload = await verify(token);

    req.user = {
      id: payload.id,
      role: payload.role,
      ...payload
    };

    return next();
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired token');
  }
});
