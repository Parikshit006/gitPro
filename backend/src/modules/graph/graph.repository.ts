/**
 * Engineering Graph Repository (Data Access & Idempotency Layer)
 *
 * Purpose:
 *   Owns PostgreSQL database interactions for Engineering Knowledge Graph nodes
 *   and relationships via Prisma. Contains zero domain calculation logic.
 *
 * Why idempotent upserts and skipDuplicates are used:
 *   When constructing complex graph topologies across 100,000 commits, merge commits
 *   and shared files cause overlapping edge and node insertion attempts.
 *   Using `skipDuplicates` translates to `INSERT INTO ... ON CONFLICT DO NOTHING`,
 *   guaranteeing 100% idempotent graph assembly without transaction rollback errors.
 */

import { prisma } from '../../lib/prisma';
import { GraphEdgeTypeDto } from './graph.types';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class GraphRepository {
  /**
   * Finds or creates a Developer node by email.
   *
   * @returns UUID of the Developer node.
   */
  async upsertDeveloper(email: string, name: string): Promise<string> {
    try {
      const dev = await prisma.developer.upsert({
        where: { email },
        update: { name }, // Keep name updated to latest author signature
        create: { email, name },
      });
      return dev.id;
    } catch (error: any) {
      throw new AppError(`Failed to upsert Developer node: ${error?.message || 'Unknown error'}`, HTTP_STATUS.INTERNAL_SERVER_ERROR, true);
    }
  }

  /**
   * Finds or creates a FileNode by repositoryId and path.
   *
   * @returns UUID of the FileNode.
   */
  async upsertFileNode(repositoryId: string, path: string): Promise<string> {
    try {
      const file = await prisma.fileNode.upsert({
        where: { repositoryId_path: { repositoryId, path } },
        update: {},
        create: { repositoryId, path },
      });
      return file.id;
    } catch (error: any) {
      throw new AppError(`Failed to upsert FileNode: ${error?.message || 'Unknown error'}`, HTTP_STATUS.INTERNAL_SERVER_ERROR, true);
    }
  }

  /**
   * Finds or creates a CommitNode by its unique hash.
   *
   * @returns UUID of the CommitNode.
   */
  async upsertCommitNode(repositoryId: string, hash: string, authoredAt: Date, message: string): Promise<string> {
    try {
      const commit = await prisma.commitNode.upsert({
        where: { hash },
        update: {},
        create: { repositoryId, hash, authoredAt, message },
      });
      return commit.id;
    } catch (error: any) {
      throw new AppError(`Failed to upsert CommitNode: ${error?.message || 'Unknown error'}`, HTTP_STATUS.INTERNAL_SERVER_ERROR, true);
    }
  }

  /**
   * Creates a directed relationship edge between two nodes in the graph.
   * Uses skipDuplicates (ON CONFLICT DO NOTHING) to ignore duplicate edges cleanly.
   *
   * @returns True if inserted, false if ignored as duplicate.
   */
  async createEdge(repositoryId: string, sourceId: string, targetId: string, type: GraphEdgeTypeDto): Promise<boolean> {
    try {
      const result = await prisma.graphEdge.createMany({
        data: [
          {
            repositoryId,
            sourceId,
            targetId,
            type: type as any,
          },
        ],
        skipDuplicates: true,
      });
      return result.count > 0;
    } catch (error: any) {
      throw new AppError(`Failed to create GraphEdge (${type}): ${error?.message || 'Unknown error'}`, HTTP_STATUS.INTERNAL_SERVER_ERROR, true);
    }
  }

  async findDeveloperByEmail(email: string): Promise<any | null> {
    try {
      return await prisma.developer.findUnique({ where: { email } });
    } catch {
      throw new AppError('Failed to find Developer by email', HTTP_STATUS.INTERNAL_SERVER_ERROR, true);
    }
  }

  async findCommitNodeByHash(hash: string): Promise<any | null> {
    try {
      return await prisma.commitNode.findUnique({ where: { hash } });
    } catch {
      throw new AppError('Failed to find CommitNode by hash', HTTP_STATUS.INTERNAL_SERVER_ERROR, true);
    }
  }

  async findFileNodeByPath(repositoryId: string, path: string): Promise<any | null> {
    try {
      return await prisma.fileNode.findUnique({ where: { repositoryId_path: { repositoryId, path } } });
    } catch {
      throw new AppError('Failed to find FileNode by path', HTTP_STATUS.INTERNAL_SERVER_ERROR, true);
    }
  }

  async findEdgesByRepository(repositoryId: string): Promise<any[]> {
    try {
      return await prisma.graphEdge.findMany({ where: { repositoryId } });
    } catch {
      throw new AppError('Failed to query GraphEdges by repository', HTTP_STATUS.INTERNAL_SERVER_ERROR, true);
    }
  }
}
