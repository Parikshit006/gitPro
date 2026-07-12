/**
 * Auth Controller
 *
 * Purpose:
 *   The HTTP transport boundary for the Auth module. This controller
 *   translates incoming HTTP requests into calls to the AuthService and
 *   formats the result back into an HTTP response.
 *
 * Why the redirect is performed here:
 *   The `res.redirect()` call is an HTTP concern — it sets the `Location`
 *   header and returns a 302 status code. This belongs exclusively in the
 *   controller because the service layer must never know that Express,
 *   HTTP, or browsers exist. The service returns a plain object containing
 *   the URL; the controller decides what to do with it over HTTP.
 *
 * Why the service never knows Express exists:
 *   By keeping the service free of `req`, `res`, and `next`, it remains
 *   independently testable, reusable from background jobs or CLI tools,
 *   and decoupled from the transport protocol entirely.
 *
 * Why controllers own cookies:
 *   Cookies are an HTTP mechanism sent via the `Set-Cookie` header. Writing
 *   a cookie binds the code to the HTTP transport layer. If the service
 *   wrote cookies, it could never be invoked over gRPC, CLI, or GraphQL.
 *
 * Why HttpOnly cookies mitigate XSS:
 *   `httpOnly: true` instructs the browser to hide the cookie from the
 *   `document.cookie` API. If an attacker successfully executes a Cross-Site
 *   Scripting (XSS) payload on the frontend, their malicious JavaScript
 *   cannot read or exfiltrate the JWT.
 *
 * Why SameSite=Lax is appropriate for OAuth:
 *   `sameSite: 'strict'` prevents the cookie from being sent on cross-site
 *   top-level navigations. Because GitHub redirects the user *back* to GitPro
 *   (a cross-site navigation), a strict cookie would be withheld on the
 *   callback, breaking the flow. `sameSite: 'lax'` allows the cookie on
 *   top-level navigations (like following a link or a 302 redirect), balancing
 *   security and usability.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';
import { authConfig } from '../../config/auth.config';

// Note: Future refactoring will transition to dependency injection for controllers
const authService = new AuthService();
const jwtService = new JwtService();

export class AuthController {
  initiateGitHubOAuth(req: Request, res: Response, next: NextFunction): void {
    try {
      const { authorizationUrl } = authService.buildAuthorizationUrl();

      res.redirect(authorizationUrl);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles the GitHub OAuth 2.0 callback.
   *
   * Triggered when GitHub redirects the user back to GitPro after they
   * authorize (or reject) the application.
   */
  async githubCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, state, error } = req.query;

      // Handle GitHub OAuth error callback (e.g., user denied access)
      if (error) {
        res.redirect(`${authConfig.failureRedirectUrl}?reason=${error}`);
        return;
      }

      if (!code || typeof code !== 'string') {
        throw new AppError(
          'Missing or invalid authorization code',
          HTTP_STATUS.BAD_REQUEST,
          true,
        );
      }

      if (!state || typeof state !== 'string') {
        throw new AppError(
          'Missing or invalid state parameter',
          HTTP_STATUS.BAD_REQUEST,
          true,
        );
      }

      // 1. AuthService orchestrates the complex business logic (validation, exchange, upsert)
      const user = await authService.authenticateWithGitHub(code, state);

      // 2. JwtService generates the stateless session token
      const token = jwtService.generateToken(user);

      // 3. Controller sets the cookie (HTTP concern)
      res.cookie(authConfig.cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: authConfig.cookieMaxAgeMs,
      });

      // 4. Controller redirects the browser (HTTP concern)
      res.redirect(authConfig.successRedirectUrl);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
