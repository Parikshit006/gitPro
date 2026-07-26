/**
 * Repository Domain Types
 *
 * Purpose:
 *   Defines the core data structures and types for the Repository domain.
 *   These types are the contract between the service, controller, and
 *   repository layers. No layer may bypass these types to exchange raw
 *   Prisma objects or untyped data.
 *
 * Why domain types are separate from Prisma types:
 *   Prisma generates types tightly coupled to the database schema (e.g.,
 *   BigInt for githubId). Domain types use transport-safe primitives
 *   (e.g., string for githubId) and can evolve independently of the
 *   database schema. This insulates the service and controller layers
 *   from ORM-specific concerns.
 */

/**
 * Repository lifecycle status.
 *
 *   REGISTERED — URL accepted, metadata persisted, no sync yet.
 *   SYNCING    — Git history is being cloned and parsed.
 *   READY      — All data ingested and available for analysis.
 *   FAILED     — A sync attempt failed; eligible for retry.
 */
export enum RepositoryStatus {
  REGISTERED = 'REGISTERED',
  SYNCING = 'SYNCING',
  READY = 'READY',
  FAILED = 'FAILED',
}

/**
 * Domain representation of a registered GitHub repository.
 *
 * This is the shape that flows between the service, controller, and
 * repository layers. It is NOT the Prisma model — it uses string for
 * githubId to ensure safe JSON serialization (BigInt cannot be
 * serialized by JSON.stringify).
 */
export interface Repository {
  id: string;
  githubId: string;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  visibility: string;
  cloneUrl: string;
  sizeKb: number;
  language: string | null;
  description: string | null;
  status: RepositoryStatus;
  registeredById: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date | null;
}

/**
 * Input DTO for the repository registration endpoint.
 */
export interface RegisterRepositoryRequest {
  url: string;
}

/**
 * Metadata extracted from the GitHub REST API response.
 *
 * Only the fields GitPro needs are captured here. GitHub's actual
 * response contains dozens of additional fields that are intentionally
 * excluded to prevent coupling to upstream API changes.
 */
export interface GitHubRepositoryMetadata {
  githubId: number;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  visibility: string;
  cloneUrl: string;
  sizeKb: number;
  language: string | null;
  description: string | null;
}
