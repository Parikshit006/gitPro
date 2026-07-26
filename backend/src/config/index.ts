import { appConfig } from './app.config';
import { authConfig } from './auth.config';
import { databaseConfig } from './database.config';
import { githubConfig } from './github.config';

/**
 * Centralized Configuration Layer
 *
 * Purpose:
 *   Aggregates all configuration modules into a single, immutable configuration
 *   object. This serves as the single source of truth for the entire application,
 *   ensuring no module outside config/ ever reads process.env directly.
 */
export const config = Object.freeze({
  app: appConfig,
  auth: authConfig,
  database: databaseConfig,
  github: githubConfig,
});

export default config;
