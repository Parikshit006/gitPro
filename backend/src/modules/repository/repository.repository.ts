/**
 * Repository Repository (Data Access Layer)
 *
 * Purpose:
 *   The data access boundary for the Repository domain. This class owns
 *   all Prisma interactions for Repository persistence and is the sole
 *   component allowed to import or call PrismaClient for Repository
 *   operations.
 *
 * Why the repository maps Prisma types to domain types:
 *   Prisma's generated types use BigInt for githubId, which cannot be
 *   serialized by JSON.stringify and is coupled to the ORM. The repository
 *   converts BigInt → string at the persistence boundary so that the
 *   service and controller layers never encounter ORM-specific types.
 *
 * Why create() uses Prisma's create instead of upsert:
 *   Repository registration is an explicit, user-initiated action. If a
 *   repository is already registered, the service layer detects the
 *   duplicate and returns a 409 Conflict before reaching the repository.
 *   Using create() ensures a unique constraint violation is caught as an
 *   unexpected error rather than silently merging data.
 *
 * Why no business logic exists here:
 *   The repository pattern enforces a single, auditable location for all
 *   database writes. URL validation, duplicate detection, and GitHub API
 *   calls are the service's responsibility. The repository only translates
 *   between domain objects and database records.
 */

import { prisma } from '../../lib/prisma';
import { Repository, RepositoryStatus, GitHubRepositoryMetadata } from './repository.types';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

/**
 * Input shape for creating a new repository record.
 * Combines GitHub metadata with internal registration data.
 */
interface CreateRepositoryInput {
  metadata: GitHubRepositoryMetadata;
  registeredById?: string | null;
}

/**
 * Maps a raw Prisma Repository record to the domain Repository interface.
 * Centralizing this conversion prevents duplication across methods.
 */
function toDomainRepository(record: {
  id: string;
  githubId: bigint;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  visibility: string;
  cloneUrl: string;
  sizeKb: number;
  language: string | null;
  description: string | null;
  status: string;
  registeredById: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date | null;
}): Repository {
  return {
    id: record.id,
    githubId: record.githubId.toString(),
    owner: record.owner,
    name: record.name,
    fullName: record.fullName,
    defaultBranch: record.defaultBranch,
    visibility: record.visibility,
    cloneUrl: record.cloneUrl,
    sizeKb: record.sizeKb,
    language: record.language,
    description: record.description,
    status: record.status as RepositoryStatus,
    registeredById: record.registeredById,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    lastSyncedAt: record.lastSyncedAt,
  };
}

export class RepositoryRepository {
  /**
   * Inserts a new repository record from GitHub metadata.
   *
   * @param input GitHub metadata and optional registering user ID.
   * @returns The persisted domain Repository.
   */
  async create(input: CreateRepositoryInput): Promise<Repository> {
    try {
      const record = await prisma.repository.create({
        data: {
          githubId: input.metadata.githubId,
          owner: input.metadata.owner,
          name: input.metadata.name,
          fullName: input.metadata.fullName,
          defaultBranch: input.metadata.defaultBranch,
          visibility: input.metadata.visibility,
          cloneUrl: input.metadata.cloneUrl,
          sizeKb: input.metadata.sizeKb,
          language: input.metadata.language,
          description: input.metadata.description,
          registeredById: input.registeredById ?? null,
        },
      });

      return toDomainRepository(record);
    } catch {
      throw new AppError(
        'Failed to persist repository record',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Finds a repository by its GitHub numeric ID.
   *
   * @returns The domain Repository or null if not found.
   */
  async findByGitHubId(githubId: number): Promise<Repository | null> {
    try {
      const record = await prisma.repository.findUnique({
        where: { githubId },
      });

      return record ? toDomainRepository(record) : null;
    } catch {
      throw new AppError(
        'Failed to query repository by GitHub ID',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Finds a repository by its internal UUID.
   *
   * @returns The domain Repository or null if not found.
   */
  async findById(id: string): Promise<Repository | null> {
    try {
      const record = await prisma.repository.findUnique({
        where: { id },
      });

      return record ? toDomainRepository(record) : null;
    } catch {
      throw new AppError(
        'Failed to query repository by ID',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Finds a repository by owner/name compound key.
   *
   * @returns The domain Repository or null if not found.
   */
  async findByFullName(owner: string, name: string): Promise<Repository | null> {
    try {
      const record = await prisma.repository.findUnique({
        where: {
          owner_name: { owner, name },
        },
      });

      return record ? toDomainRepository(record) : null;
    } catch {
      throw new AppError(
        'Failed to query repository by owner/name',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Updates the lifecycle status of a repository.
   *
   * @param id Internal UUID of the repository.
   * @param status The new RepositoryStatus value.
   * @returns The updated domain Repository.
   */
  async updateStatus(id: string, status: RepositoryStatus): Promise<Repository> {
    try {
      const record = await prisma.repository.update({
        where: { id },
        data: { status },
      });

      return toDomainRepository(record);
    } catch {
      throw new AppError(
        'Failed to update repository status',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Updates the repository record upon successful synchronization.
   * Sets status to READY, updates disk size in KB, and stamps lastSyncedAt.
   *
   * @param id Internal UUID of the repository.
   * @param sizeKb Updated size of the clone on disk in kilobytes.
   * @param lastSyncedAt Timestamp of the sync completion.
   */
  async updateSyncSuccess(id: string, sizeKb: number, lastSyncedAt: Date): Promise<Repository> {
    try {
      const record = await prisma.repository.update({
        where: { id },
        data: {
          status: RepositoryStatus.READY,
          sizeKb,
          lastSyncedAt,
        },
      });

      return toDomainRepository(record);
    } catch {
      throw new AppError(
        'Failed to update repository sync metadata',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }
}
