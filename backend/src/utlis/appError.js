/**
 * Small operational-error helper so services can `throw new AppError(msg, 404)`
 * and let the global error handler in app.controller.js turn it into a clean
 * JSON response with the right status code.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export default AppError;
