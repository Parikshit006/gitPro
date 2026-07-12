/**
 * Auth Configuration
 *
 * Purpose:
 *   Centralizes configuration variables for authentication, including cookies
 *   and redirects.
 */

export const authConfig = Object.freeze({
  cookieName: process.env.AUTH_COOKIE_NAME || 'gitpro_session',
  cookieMaxAgeMs: process.env.AUTH_COOKIE_MAX_AGE_MS 
    ? parseInt(process.env.AUTH_COOKIE_MAX_AGE_MS, 10) 
    : 7 * 24 * 60 * 60 * 1000, // Default to 7 days
  successRedirectUrl: process.env.AUTH_SUCCESS_REDIRECT_URL || '/dashboard',
  failureRedirectUrl: process.env.AUTH_FAILURE_REDIRECT_URL || '/login?error=oauth_failed',
});
