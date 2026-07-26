/**
 * Engineering Graph Mapper
 *
 * Purpose:
 *   Strictly isolates Prisma database records from domain graph consumers.
 *   Converts raw database nodes and edges into decoupled domain DTOs.
 */

import { DeveloperNodeDto, FileNodeDto, CommitNodeDto, GraphEdgeDto, GraphEdgeTypeDto } from './graph.types';

export class GraphMapper {
  toDeveloperDto(record: any): DeveloperNodeDto {
    return {
      id: record.id,
      email: record.email,
      name: record.name,
      createdAt: record.createdAt ? new Date(record.createdAt) : undefined,
    };
  }

  toFileNodeDto(record: any): FileNodeDto {
    return {
      id: record.id,
      repositoryId: record.repositoryId,
      path: record.path,
      createdAt: record.createdAt ? new Date(record.createdAt) : undefined,
    };
  }

  toCommitNodeDto(record: any): CommitNodeDto {
    return {
      id: record.id,
      repositoryId: record.repositoryId,
      hash: record.hash,
      authoredAt: new Date(record.authoredAt),
      message: record.message,
      createdAt: record.createdAt ? new Date(record.createdAt) : undefined,
    };
  }

  toGraphEdgeDto(record: any): GraphEdgeDto {
    return {
      id: record.id,
      repositoryId: record.repositoryId,
      sourceId: record.sourceId,
      targetId: record.targetId,
      type: record.type as GraphEdgeTypeDto,
      createdAt: record.createdAt ? new Date(record.createdAt) : undefined,
    };
  }
}
