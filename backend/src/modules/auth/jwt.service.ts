import jwt from 'jsonwebtoken';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';
import { User } from '../user/user.types';

/**
 * JWT Service
 *
 * Purpose:
 *   Owns token generation and verification for GitPro sessions.
 *   No other class is permitted to directly import or call jsonwebtoken.
 *
 * Security Rationale:
 *
 *   Why JWT payload is not encrypted:
 *     JWTs (JWS) are signed, not encrypted. The signature guarantees
 *     integrity (the token wasn't tampered with) and authenticity (it was
 *     issued by GitPro). Because it is only Base64-encoded, anyone can
 *     read the payload. Therefore, sensitive data is never stored in a JWT.
 *
 *   Why only minimal claims should be stored:
 *     Storing only `sub` (internal UUID) and `githubId` keeps the token
 *     small and minimizes data exposure. Profile data (username, email,
 *     avatar) is fetched from the database using the `sub` claim. We NEVER
 *     store GitHub access tokens in the JWT, as that would leak full GitHub
 *     account access to the client.
 *
 *   Why JWT_SECRET must never leave the backend:
 *     The secret is the symmetric key used to sign the tokens. If an
 *     attacker obtains the secret, they can forge valid JWTs for ANY user
 *     in the system, leading to complete account takeover.
 *
 *   Why expiration is mandatory:
 *     JWTs are stateless. Once issued, they cannot be easily revoked without
 *     maintaining a stateful blacklist (which defeats the purpose of JWT).
 *     A mandatory expiration limits the window of opportunity if a token
 *     is stolen.
 *
 *   Why HttpOnly cookies will be used instead of LocalStorage:
 *     Tokens stored in LocalStorage are accessible to any JavaScript running
 *     on the page, making them highly vulnerable to Cross-Site Scripting (XSS).
 *     HttpOnly cookies are inaccessible to JavaScript, completely mitigating
 *     token theft via XSS. (Cookie implementation is handled in the transport layer).
 */

export interface JwtPayload {
  sub: string;
  githubId: string;
  iat?: number;
  exp?: number;
}

export class JwtService {
  private readonly secret: string;
  private readonly expiresIn = '7d'; // TODO: Move to environment configuration

  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('FATAL: JWT_SECRET environment variable is missing.');
    }
    this.secret = secret;
  }

  /**
   * Generates a signed JWT for the authenticated user.
   *
   * @param user The persisted User domain model.
   * @returns A signed JWT string.
   */
  generateToken(user: User): string {
    const payload = {
      sub: user.id,
      githubId: user.githubId.toString(),
    };

    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
      algorithm: 'HS256',
    });
  }

  /**
   * Verifies the token signature, expiration, and algorithm.
   *
   * @param token The raw JWT string.
   * @returns The decoded JwtPayload.
   * @throws AppError if the token is invalid, expired, or malformed.
   */
  verifyToken(token: string): JwtPayload {
    try {
      // Verify signature and enforce HS256 algorithm to prevent algorithm downgrade attacks
      const decoded = jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
      }) as JwtPayload;

      if (!decoded.sub) {
        throw new AppError(
          'Invalid authentication token: missing subject claim.',
          HTTP_STATUS.UNAUTHORIZED,
          true,
        );
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(
          'Session expired. Please log in again.',
          HTTP_STATUS.UNAUTHORIZED,
          true,
        );
      }

      throw new AppError(
        'Invalid authentication token.',
        HTTP_STATUS.UNAUTHORIZED,
        true,
      );
    }
  }
}
