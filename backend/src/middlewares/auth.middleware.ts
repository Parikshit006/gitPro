/**
 * Authentication Middleware
 *
 * Purpose:
 *   Validates incoming JSON Web Tokens (JWT) from the Authorization header
 *   and attaches the decoded user claims to the Express Request object.
 *   Prevents unauthenticated requests from reaching downstream controllers.
 */

import { Request, Response, NextFunction } from 'express';
import { JwtService, JwtPayload } from '../modules/auth/jwt.service';
import { AppError } from '../errors/AppError';
import { HTTP_STATUS } from '../constants/httpStatus';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

const jwtService = new JwtService();

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token missing or malformed.', HTTP_STATUS.UNAUTHORIZED, true);
    }

    const token = authHeader.split(' ')[1];
    const payload = jwtService.verifyToken(token);

    (req as AuthenticatedRequest).user = payload;
    next();
  } catch (error) {
    next(error);
  }
};
