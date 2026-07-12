/**
 * GitHub OAuth Configuration
 *
 * Purpose:
 *   Loads, validates, and exports the GitHub OAuth credentials as an immutable
 *   configuration object. This file is the single source of truth for all
 *   GitHub OAuth settings across the application.
 *
 * Why validation happens at startup:
 *   If a required secret is missing, the server must fail immediately and
 *   loudly rather than accepting traffic and silently failing on the first
 *   authentication request minutes or hours later. Startup validation
 *   guarantees that every running instance of GitPro has a complete and
 *   valid configuration. A misconfigured deployment is caught during CI/CD
 *   or container boot — not by a user clicking "Login with GitHub".
 *
 * Why immutable configuration:
 *   Once validated, configuration values must never change at runtime.
 *   Object.freeze prevents accidental mutation, dependency injection of
 *   modified values, or prototype pollution attacks from altering secrets
 *   after the application has started.
 *
 * Why secrets must never appear in logs:
 *   The GITHUB_CLIENT_SECRET grants the ability to exchange authorization
 *   codes for access tokens on behalf of any GitPro user. If it appears in
 *   application logs, error tracking services, or stdout, it can be
 *   harvested from log aggregation systems (e.g., CloudWatch, Datadog) by
 *   anyone with read access. The error messages in this file intentionally
 *   name the missing variable without printing its value.
 */

const requiredVars = [
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GITHUB_CALLBACK_URL',
] as const;

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    throw new Error(
      `[FATAL] Missing required environment variable: ${varName}. ` +
        'The server cannot start without a complete GitHub OAuth configuration.',
    );
  }
}

export const githubOAuthConfig = Object.freeze({
  clientId: process.env.GITHUB_CLIENT_ID as string,
  clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
  callbackUrl: process.env.GITHUB_CALLBACK_URL as string,
});
