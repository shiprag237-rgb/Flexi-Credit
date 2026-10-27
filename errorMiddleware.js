import { sendError } from '../utils/responseFormatter.js';

export const errorHandler = (err, req, res, next) => {
  console.error('[Global Error]', err);

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, `Resource not found with specified ID (${err.value}).`, 404, 'NOT_FOUND');
  }

  // Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return sendError(res, `A record with this ${field} already exists.`, 409, 'DUPLICATE_KEY', { field });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
    }));
    return sendError(res, 'Database validation error.', 400, 'VALIDATION_ERROR', details);
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'An unexpected error occurred. Please try again later.'
    : err.message || 'Server error';

  return sendError(res, message, statusCode, err.code || 'SERVER_ERROR');
};

export const notFoundHandler = (req, res) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND');
};
