/**
 * Database Configuration
 *
 * Purpose:
 *   Owns database connection settings, specifically validating DATABASE_URL
 *   at startup to fail fast if the application cannot connect to PostgreSQL.
 *
 * Why fail-fast configuration is safer:
 *   Without a valid database connection string, no persistent operations can
 *   succeed. By verifying the presence of DATABASE_URL during boot, we prevent
 *   the application from accepting traffic that would inevitably result in 500
 *   Internal Server Errors.
 */

if (!process.env.DATABASE_URL) {
  throw new Error(
    '[FATAL] Missing required environment variable: DATABASE_URL. ' +
      'The server cannot start without a database connection string.',
  );
}

export const databaseConfig = Object.freeze({
  url: process.env.DATABASE_URL as string,
});
