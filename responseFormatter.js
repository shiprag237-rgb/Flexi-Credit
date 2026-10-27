export const sendSuccess = (res, data = null, message = null, statusCode = 200, meta = null) => {
  const payload = {
    success: true,
  };
  if (message) payload.message = message;
  if (data !== null) payload.data = data;
  if (meta !== null) payload.meta = meta;

  return res.status(statusCode).json(payload);
};

export const sendError = (res, message = 'Internal Server Error', statusCode = 500, code = 'SERVER_ERROR', details = null) => {
  const payload = {
    success: false,
    error: {
      code,
      message,
    },
  };
  if (details) payload.error.details = details;

  return res.status(statusCode).json(payload);
};
