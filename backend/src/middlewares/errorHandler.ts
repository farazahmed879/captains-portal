import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { HTTP_STATUS, MESSAGES } from '../constants';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // If headers are already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle custom ApiError
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors && err.errors.length > 0 ? err.errors : undefined,
    });
    return;
  }

  // Handle Prisma Known Request Errors
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    let statusCode: number = HTTP_STATUS.BAD_REQUEST;
    let message = 'Database operation failed';

    if (err.code === 'P2002') {
      statusCode = HTTP_STATUS.CONFLICT;
      message = 'A record with this unique value already exists';
    } else if (err.code === 'P2025') {
      statusCode = HTTP_STATUS.NOT_FOUND;
      message = 'The requested record was not found';
    }

    res.status(statusCode).json({
      success: false,
      statusCode,
      message,
    });
    return;
  }

  console.error('Unhandled Server Error:', err);

  const statusCode = err.status || err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || MESSAGES.INTERNAL_ERROR;

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
};
