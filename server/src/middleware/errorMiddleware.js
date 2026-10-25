import { errorResponse } from '../utils/responseHelper.js';

export function errorHandler(err, req, res, next) {
  console.error('[Error Middleware]:', err);

  // MySQL specific errors
  if (err.code === 'ER_SIGNAL_EXCEPTION') {
    // Custom trigger error (e.g. trg_prevent_evidence_delete)
    return errorResponse(res, err.sqlMessage || err.message, 400, null, 'SQL_TRIGGER_VIOLATION');
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return errorResponse(res, 'A record with this identifier already exists.', 409, null, 'DUPLICATE_ENTRY');
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    return errorResponse(res, 'Referenced parent record does not exist.', 400, null, 'FOREIGN_KEY_VIOLATION');
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    return errorResponse(res, 'Cannot delete or alter record: dependent records exist.', 400, null, 'FOREIGN_KEY_RESTRICT');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid authentication token.', 401, null, 'AUTH_INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Authentication token has expired.', 401, null, 'AUTH_TOKEN_EXPIRED');
  }

  // Multer errors
  if (err.name === 'MulterError') {
    return errorResponse(res, `File upload error: ${err.message}`, 400, null, 'FILE_UPLOAD_ERROR');
  }

  // Standard API errors with explicit status code
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return errorResponse(res, message, status, err.details || null, err.code || null);
}

export function notFoundHandler(req, res) {
  return errorResponse(res, `Route ${req.method} ${req.originalUrl} not found.`, 404, null, 'NOT_FOUND');
}
