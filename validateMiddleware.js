import { sendError } from '../utils/responseFormatter.js';

export const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err.errors) {
      const details = err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return sendError(res, 'Validation failed for request body.', 400, 'VALIDATION_ERROR', details);
    }
    return sendError(res, 'Invalid request data.', 400, 'VALIDATION_ERROR');
  }
};

export const validateQuery = (schema) => (req, res, next) => {
  try {
    req.query = schema.parse(req.query);
    next();
  } catch (err) {
    if (err.errors) {
      const details = err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return sendError(res, 'Validation failed for query parameters.', 400, 'VALIDATION_ERROR', details);
    }
    return sendError(res, 'Invalid query parameters.', 400, 'VALIDATION_ERROR');
  }
};
