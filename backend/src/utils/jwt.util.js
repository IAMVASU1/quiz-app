/**
 * JWT helper: sign & verify tokens.
 *
 * Requires env:
 * - JWT_SECRET
 * - JWT_EXPIRES (e.g. '7d' or '1h')
 */

import jwt from 'jsonwebtoken';
import ApiError from './ApiError.js';

const SECRET = process.env.JWT_SECRET || 'changeme';
const EXPIRES_IN = process.env.JWT_EXPIRES || '7d';

export function sign(payload = {}, options = {}) {
  const signOpts = { expiresIn: EXPIRES_IN, ...options };
  return jwt.sign(payload, SECRET, signOpts);
}

export function verify(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired token', [
      { message: err.message }
    ]);
  }
}
