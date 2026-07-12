import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { HTTP_STATUS } from '../constants/httpStatus';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, HTTP_STATUS.NOT_FOUND);
  next(error); // Pass to the global error handler
};
