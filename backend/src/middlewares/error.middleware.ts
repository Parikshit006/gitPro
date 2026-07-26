import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { HTTP_STATUS } from '../constants/httpStatus';
import config from '../config';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
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
    ...(config.app.nodeEnv === 'development' && { stack: err.stack }),
  };


  res.status(statusCode).json(response);
};
