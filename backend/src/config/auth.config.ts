/**
 * Auth Configuration
 *
 * Purpose:
 *   Centralizes configuration variables for authentication, including JWT
 *   secret, token expiration, cookie parameters, and OAuth redirect URLs.
 *
 * Why immutable configuration prevents accidental mutation:
 *   Object.freeze ensures that sensitive settings like jwtSecret or cookie
 *   names cannot be modified at runtime by buggy logic or malicious payloads,
 *   preserving authentication integrity across the application's lifecycle.
 */

if (!process.env.JWT_SECRET) {
  throw new Error(
    '[FATAL] Missing required environment variable: JWT_SECRET. ' +
      'The server cannot start without a JWT signing secret.',
  );
}

const cookieMaxAgeMs = process.env.COOKIE_MAX_AGE 
  ? parseInt(process.env.COOKIE_MAX_AGE, 10) 
  : (process.env.AUTH_COOKIE_MAX_AGE_MS ? parseInt(process.env.AUTH_COOKIE_MAX_AGE_MS, 10) : 7 * 24 * 60 * 60 * 1000);

if (isNaN(cookieMaxAgeMs) || cookieMaxAgeMs <= 0) {
  throw new Error(`[FATAL] Invalid cookie max age specified: ${process.env.COOKIE_MAX_AGE || process.env.AUTH_COOKIE_MAX_AGE_MS}`);
}

export const authConfig = Object.freeze({
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: process.env.COOKIE_NAME || process.env.AUTH_COOKIE_NAME || 'gitpro_session',
  cookieMaxAge: cookieMaxAgeMs,
  cookieMaxAgeMs: cookieMaxAgeMs, // Kept for backward compatibility with controller
  successRedirectUrl: process.env.AUTH_SUCCESS_REDIRECT_URL || '/dashboard',
  failureRedirectUrl: process.env.AUTH_FAILURE_REDIRECT_URL || '/login?error=oauth_failed',
});
