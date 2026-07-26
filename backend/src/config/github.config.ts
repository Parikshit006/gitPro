/**
 * GitHub OAuth Configuration
 *
 * Purpose:
 *   Loads, validates, and exports GitHub OAuth credentials as an immutable
 *   configuration object.
 *
 * Why secrets must never appear in logs:
 *   The GITHUB_CLIENT_SECRET grants the ability to exchange authorization
 *   codes for access tokens on behalf of any GitPro user. If it appears in
 *   application logs, error tracking services, or stdout, it can be harvested
 *   from log aggregation systems by anyone with read access. The error
 *   messages intentionally name the missing variable without printing its value.
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

export const githubConfig = Object.freeze({
  clientId: process.env.GITHUB_CLIENT_ID as string,
  clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
  callbackUrl: process.env.GITHUB_CALLBACK_URL as string,
});
