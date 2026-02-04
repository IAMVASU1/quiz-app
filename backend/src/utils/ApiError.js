/**
 * ApiError extends Error with http status and optional payload.
 * Throw new ApiError(400, "Bad input", [{ field: 'email', msg: 'invalid' }])
 */

export default class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong", errors = [], stack = "") {
    super(message);

    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
