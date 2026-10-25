export function successResponse(res, data = null, message = 'Success', statusCode = 200, meta = null) {
  const payload = {
    success: true,
    message,
    data,
  };
  if (meta) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
}

export function errorResponse(res, message = 'An error occurred', statusCode = 500, details = null, code = null) {
  const payload = {
    success: false,
    error: {
      code: code || `ERR_${statusCode}`,
      message,
    },
  };
  if (details) {
    payload.error.details = details;
  }
  return res.status(statusCode).json(payload);
}
