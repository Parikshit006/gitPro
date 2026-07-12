import { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';
import { GitHubUserProfile } from '../auth/github.provider';

/**
 * User Repository
 *
 * Purpose:
 *   The data access boundary for the User domain. This repository owns
 *   all Prisma interactions for User persistence and is the sole component
 *   allowed to import or call PrismaClient for User operations.
 *
 * Why upsert prevents duplicate users:
 *   Prisma's upsert() is an atomic operation that checks for an existing
 *   record matching the `where` clause and either updates it or creates
 *   a new one — all within a single database transaction. This eliminates
 *   the race condition where two concurrent OAuth callbacks for the same
 *   GitHub user could both pass a "does user exist?" check and both
 *   attempt an INSERT, causing a unique constraint violation.
 *
 * Why AuthService should never know Prisma exists:
 *   The service layer orchestrates business rules. If it imported
 *   PrismaClient directly, it would be coupled to a specific ORM and
 *   database. By isolating Prisma inside the repository, the service
 *   can be tested with a mock repository, and the database technology
 *   can be swapped without touching business logic.
 *
 * Why persistence belongs inside the repository:
 *   The repository pattern enforces a single, auditable location for
 *   all database writes. No other layer (controller, service, provider)
 *   is permitted to execute SQL or Prisma calls. This makes data access
 *   patterns predictable, testable, and easy to review for security.
 */


export class UserRepository {
  /**
   * Inserts a new user or updates an existing one based on GitHub ID.
   *
   * - If a user with the given githubId exists: updates profile fields
   *   and sets lastLoginAt to now.
   * - If no user exists: creates a new record with all profile fields
   *   and sets lastLoginAt to now.
   *
   * Returns the persisted User record.
   */
  async upsertByGitHubId(profile: GitHubUserProfile): Promise<User> {
    try {
      const now = new Date();

      return await prisma.user.upsert({
        where: { githubId: profile.githubId },
        update: {
          username: profile.username,
          displayName: profile.displayName,
          email: profile.email || null,
          avatarUrl: profile.avatarUrl,
          profileUrl: profile.profileUrl,
          lastLoginAt: now,
        },
        create: {
          githubId: profile.githubId,
          username: profile.username,
          displayName: profile.displayName,
          email: profile.email || null,
          avatarUrl: profile.avatarUrl,
          profileUrl: profile.profileUrl,
          lastLoginAt: now,
        },
      });
    } catch (_error) {
      throw new AppError(
        'Failed to persist user record',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }
}
