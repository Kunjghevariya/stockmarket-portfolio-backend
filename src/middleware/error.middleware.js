import { ApiError } from '../utils/ApiError.js';

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const payload = {
    success: false,
    message,
    errors: err.errors || [],
  };

  // hide stack in production
  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }

  console.error(err);
  res.status(status).json(payload);
};
