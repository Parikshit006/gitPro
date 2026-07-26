/**
 * Application Configuration
 *
 * Purpose:
 *   Owns application-level configuration settings like PORT and NODE_ENV,
 *   validates them, and provides sensible defaults for development.
 *
 * Why configuration is centralized:
 *   Spreading process.env checks across controllers, services, and middlewares
 *   creates hidden dependencies and makes testing difficult. Centralizing
 *   configuration into dedicated modules ensures all environment variables are
 *   parsed, typed, and validated in one place before the application starts.
 *
 * Why process.env should never leak across the application:
 *   process.env variables are always strings or undefined. If raw process.env
 *   calls leak into application logic, developers must repeatedly cast types
 *   (e.g., parseInt) and handle missing variables at runtime. A centralized
 *   layer encapsulates type-casting and defaults, exposing a clean, strongly-
 *   typed interface to the rest of the application.
 *
 * Why fail-fast configuration is safer:
 *   If a mandatory secret or configuration setting is missing, failing at boot
 *   time (fail-fast) prevents the application from starting in an unstable or
 *   insecure state. A server that fails immediately upon startup is easily
 *   caught by CI/CD pipelines and deployment orchestrators, avoiding subtle
 *   runtime failures in production hours later.
 *
 * Why immutable configuration prevents accidental mutation:
 *   Using Object.freeze guarantees that configuration objects cannot be
 *   altered at runtime. This prevents bugs, prototype pollution attacks, and
 *   accidental modifications by third-party libraries or internal code from
 *   changing critical runtime behavior after startup.
 */

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
if (isNaN(port) || port < 0 || port > 65535) {
  throw new Error(`[FATAL] Invalid PORT specified in environment: ${process.env.PORT}`);
}

const validNodeEnvs = ['development', 'production', 'test'] as const;
type NodeEnv = (typeof validNodeEnvs)[number];

const rawNodeEnv = process.env.NODE_ENV || 'development';
if (!validNodeEnvs.includes(rawNodeEnv as NodeEnv)) {
  throw new Error(
    `[FATAL] Invalid NODE_ENV: ${rawNodeEnv}. Must be one of: ${validNodeEnvs.join(', ')}`,
  );
}

export const appConfig = Object.freeze({
  port,
  nodeEnv: rawNodeEnv as NodeEnv,
});
