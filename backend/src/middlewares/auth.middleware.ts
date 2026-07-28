/**
 * Authentication Middleware
 *
 * Purpose:
 *   Validates incoming JSON Web Tokens (JWT) from EITHER:
 *   1. The HttpOnly cookie (gitpro_session) — primary method after GitHub OAuth
 *   2. The Authorization: Bearer header — for programmatic API clients / CI pipelines
 *
 *   Attaches the decoded user claims to the Express Request object so controllers
 *   can access req.user without parsing tokens themselves.
 *
 * Why both cookie and header are supported:
 *   The browser-based OAuth flow stores the JWT in an HttpOnly cookie, which is
 *   automatically sent with every request via CORS withCredentials. However,
 *   programmatic clients (CI/CD scripts, third-party integrations) cannot easily
 *   set cookies, so they use the Authorization: Bearer header pattern.
 *   Supporting both makes GitPro usable from browsers and scripts alike.
 *
 * Why HttpOnly cookies mitigate XSS:
 *   httpOnly: true instructs the browser to hide the cookie from document.cookie.
 *   If an attacker successfully runs XSS, their JavaScript cannot read or exfiltrate
 *   the JWT because it's invisible to the JavaScript runtime.
 */

import { Request, Response, NextFunction } from 'express';
import { JwtService, JwtPayload } from '../modules/auth/jwt.service';
import { AppError } from '../errors/AppError';
import { HTTP_STATUS } from '../constants/httpStatus';
import config from '../config';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

const jwtService = new JwtService();

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let token: string | undefined;

    // 1. Try HttpOnly cookie (primary — browser OAuth flow)
    const cookieName = config.auth.cookieName;
    if (req.cookies && req.cookies[cookieName]) {
      token = req.cookies[cookieName] as string;
    }

    // 2. Fall back to Authorization: Bearer header (programmatic API clients)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      throw new AppError(
        'Authentication required. No session cookie or Bearer token found.',
        HTTP_STATUS.UNAUTHORIZED,
        true,
      );
    }

    const payload = jwtService.verifyToken(token);
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch (error) {
    next(error);
  }
};
