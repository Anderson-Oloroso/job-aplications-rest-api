import { ApiResponse } from '../utils/response.util.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  if (statusCode === 500) {
    console.error('SERVER ERROR:', err);
  }

  return ApiResponse.error(res, message, statusCode);
};