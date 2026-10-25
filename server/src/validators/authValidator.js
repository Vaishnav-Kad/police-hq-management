import { errorResponse } from '../utils/responseHelper.js';

/**
 * Validate officer login input body
 */
export function validateLoginInput(req, res, next) {
  const { badge_number, password } = req.body;
  const errors = [];

  if (!badge_number || typeof badge_number !== 'string' || badge_number.trim() === '') {
    errors.push('Badge number is required and must be a valid non-empty string.');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return errorResponse(res, 'Validation failed for login payload.', 400, errors, 'ERR_VALIDATION_FAILED');
  }

  req.body.badge_number = badge_number.trim().toUpperCase();
  next();
}
