/**
 * Auth Controller
 *
 * Purpose:
 *   The HTTP transport boundary for the Auth module. Translates incoming HTTP
 *   requests into calls to AuthService and formats responses back as HTTP.
 *
 * Endpoints:
 *   GET  /github          — Initiates GitHub OAuth (redirects browser to GitHub)
 *   GET  /github/callback — Handles GitHub callback, issues JWT cookie, redirects to frontend dashboard
 *   GET  /me              — Returns the authenticated user's profile (cookie-based auth)
 *   POST /logout          — Clears the session cookie
 *
 * Security Decisions:
 *   - JWT is stored in an HttpOnly + SameSite=Lax cookie (not localStorage) to prevent XSS theft.
 *   - SameSite=Lax allows the cookie on top-level navigations (OAuth redirect) but blocks CSRF.
 *   - secure: true is enforced in production to require HTTPS.
 *   - logout uses clearCookie with the exact same options to ensure the browser removes it.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { UserRepository } from '../user/user.repository';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';
import { ApiResponse } from '../../utils/ApiResponse';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import config from '../../config';

const authService = new AuthService();
const jwtService = new JwtService();
const userRepository = new UserRepository();

export class AuthController {
  /**
   * GET /github
   * Redirects the browser to the GitHub OAuth authorization page.
   */
  initiateGitHubOAuth(req: Request, res: Response, next: NextFunction): void {
    try {
      const { authorizationUrl } = authService.buildAuthorizationUrl();
      res.redirect(authorizationUrl);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /github/callback
   * Handles the GitHub OAuth 2.0 callback.
   * Exchanges the authorization code for a JWT cookie and redirects to the frontend dashboard.
   */
  async githubCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, state, error } = req.query;

      // Handle GitHub OAuth error callback (e.g., user denied access)
      if (error) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/login?error=${error}`);
        return;
      }

      if (!code || typeof code !== 'string') {
        throw new AppError('Missing or invalid authorization code', HTTP_STATUS.BAD_REQUEST, true);
      }

      if (!state || typeof state !== 'string') {
        throw new AppError('Missing or invalid state parameter', HTTP_STATUS.BAD_REQUEST, true);
      }

      // 1. AuthService orchestrates validation, exchange, and user upsert
      const user = await authService.authenticateWithGitHub(code, state);

      // 2. JwtService generates the stateless session token
      const token = jwtService.generateToken(user);

      // 3. Controller sets the HttpOnly cookie (HTTP concern)
      res.cookie(config.auth.cookieName, token, {
        httpOnly: true,
        secure: config.app.nodeEnv === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: config.auth.cookieMaxAge,
      });

      // 4. Redirect to the frontend dashboard
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/dashboard`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /me
   * Returns the currently authenticated user's profile.
   * Requires a valid session cookie or Bearer token.
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user?.sub) {
        throw new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED, true);
      }

      const user = await userRepository.findById(authReq.user.sub);
      if (!user) {
        throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, true);
      }

      ApiResponse.success(res, 'Authenticated user retrieved', {
        id: user.id,
        githubId: user.githubId.toString(),
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /logout
   * Clears the session cookie, ending the user's session.
   */
  logout(req: Request, res: Response, next: NextFunction): void {
    try {
      res.clearCookie(config.auth.cookieName, {
        httpOnly: true,
        secure: config.app.nodeEnv === 'production',
        sameSite: 'lax',
        path: '/',
      });
      ApiResponse.success(res, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
