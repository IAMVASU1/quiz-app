// src/middlewares/error.middleware.js
/**
 * Centralized error handler (ESM)
 */

import ApiError from '../utils/ApiError.js';

export default function errorHandler(err, req, res, next) {
  // ApiError → structured response
  if (err instanceof ApiError) {
    const status = err.statusCode || 500;
    const payload = {
      success: false,
      message: err.message || 'Error',
      data: err.data || null
    };

    if (Array.isArray(err.errors) && err.errors.length) {
      payload.errors = err.errors;
    }

    if (process.env.NODE_ENV !== 'production' && err.stack) {
      payload.stack = err.stack;
    }

    return res.status(status).json(payload);
  }

  // Generic errors
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  const response = {
    success: false,
    message,
    data: null
  };

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  // Logging
  if (process.env.NODE_ENV === 'production') {
    console.error(`[ERROR] ${message}`);
  } else {
    console.error(err);
  }

  return res.status(status).json(response);
}
