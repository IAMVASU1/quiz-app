// src/middlewares/role.middleware.js
/**
 * Role middleware factory (ESM)
 *
 * Usage:
 *   import role from './role.middleware.js';
 *   router.get('/admin-only', auth, role('admin'), handler);
 *   router.get('/faculty-or-admin', auth, role(['faculty','admin']), handler);
 */

import ApiError from '../utils/ApiError.js';

export default function role(required) {
  const requiredRoles = Array.isArray(required) ? required : [required];

  return (req, res, next) => {
    const user = req.user;

    if (!user || !user.role) {
      return next(new ApiError(401, 'Not authenticated'));
    }

    if (!requiredRoles.includes(user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }

    return next();
  };
}
