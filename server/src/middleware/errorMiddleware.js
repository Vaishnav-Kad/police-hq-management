import { errorResponse } from '../utils/responseHelper.js';

export function errorHandler(err, req, res, next) {
  console.error('[Error Middleware]:', err);

  // MySQL specific errors
  if (err.code === 'ER_SIGNAL_EXCEPTION') {
    // Custom trigger or procedure error (e.g. trg_prevent_evidence_delete or sp_convert_fir_to_case)
    return errorResponse(res, err.sqlMessage || err.message, 400, null, 'SQL_TRIGGER_VIOLATION');
  }

  if (err.code === 'ER_DUP_ENTRY') {
    let detailMsg = 'A record with this identifier already exists in the database.';
    if (err.sqlMessage) {
      const match = err.sqlMessage.match(/Duplicate entry '([^']+)' for key '([^']+)'/i);
      if (match) {
        const val = match[1];
        const key = match[2].split('.').pop().replace(/_/g, ' ');
        detailMsg = `Duplicate entry error: The value '${val}' is already registered for ${key}. Please enter a unique ${key}.`;
      } else {
        detailMsg = `Duplicate entry error: ${err.sqlMessage}`;
      }
    }
    return errorResponse(res, detailMsg, 409, { sqlMessage: err.sqlMessage }, 'DUPLICATE_ENTRY');
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    return errorResponse(
      res,
      `Referenced record does not exist: ${err.sqlMessage || 'Invalid Foreign Key reference.'}`,
      400,
      { sqlMessage: err.sqlMessage },
      'FOREIGN_KEY_VIOLATION'
    );
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    return errorResponse(
      res,
      'Cannot delete or alter record: other dependent records reference it in the database.',
      400,
      { sqlMessage: err.sqlMessage },
      'FOREIGN_KEY_RESTRICT'
    );
  }

  if (err.code === 'ER_DATA_TOO_LONG') {
    return errorResponse(
      res,
      `Data validation error: Value exceeds allowable column length. (${err.sqlMessage || ''})`,
      400,
      { sqlMessage: err.sqlMessage },
      'DATA_TOO_LONG'
    );
  }

  if (err.code === 'ER_BAD_NULL_ERROR') {
    return errorResponse(
      res,
      `Missing required field: ${err.sqlMessage || 'Required field cannot be empty.'}`,
      400,
      { sqlMessage: err.sqlMessage },
      'BAD_NULL_ERROR'
    );
  }

  if (err.code === 'ER_TRUNCATED_WRONG_VALUE' || err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
    return errorResponse(
      res,
      `Invalid data format: ${err.sqlMessage || 'Data could not be parsed for target field.'}`,
      400,
      { sqlMessage: err.sqlMessage },
      'INVALID_FORMAT'
    );
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
