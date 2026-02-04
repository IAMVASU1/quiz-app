// src/middlewares/validate.middleware.js
/**
 * Request validation middleware (ESM)
 *
 * Usage:
 *   import validate from '../middlewares/validate.middleware.js';
 *   import Joi from 'joi';
 *   router.post('/', validate({ body: Joi.object({...}) }), handler);
 *
 * Accepts optional `body`, `query`, and `params` Joi schemas.
 */

import ApiError from '../utils/ApiError.js';

export default function validate(schemas = {}) {
  return (req, res, next) => {
    try {
      const toValidate = ['params', 'query', 'body'];

      for (const key of toValidate) {
        if (!schemas[key]) continue;

        const { error, value } = schemas[key].validate(req[key], {
          abortEarly: false,
          stripUnknown: true
        });

        if (error) {
          const details = error.details
            ? error.details.map((d) => d.message)
            : [error.message || 'Validation error'];

          return next(new ApiError(400, 'Validation error', details));
        }

        req[key] = value; // sanitized data
      }

      return next();
    } catch (err) {
      return next(
        new ApiError(400, 'Validation middleware error', [
          err.message || String(err)
        ])
      );
    }
  };
}
