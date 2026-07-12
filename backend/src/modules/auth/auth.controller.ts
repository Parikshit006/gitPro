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
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

export class AuthController {
  initiateGitHubOAuth(req: Request, res: Response, next: NextFunction): void {
    try {
      const { authorizationUrl } = authService.buildAuthorizationUrl();

      res.redirect(authorizationUrl);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
