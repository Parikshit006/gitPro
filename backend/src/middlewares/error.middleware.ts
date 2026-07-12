import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { HTTP_STATUS } from '../constants/httpStatus';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else {
    // Log unexpected errors for internal debugging
    console.error('[UNHANDLED ERROR]', err);
  }

  // Never expose stack traces in production
  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};
