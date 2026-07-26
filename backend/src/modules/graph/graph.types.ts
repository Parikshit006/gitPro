/**
 * Engineering Graph Domain DTOs & Types (Sprint 4 Phase 1)
 *
 * Purpose:
 *   Defines domain node and edge data structures for the repository engineering
 *   knowledge graph. Decoupled from Prisma ORM models and database annotations.
 */

export enum GraphEdgeTypeDto {
  AUTHORED = 'AUTHORED',
  MODIFIED = 'MODIFIED',
  PARENT_OF = 'PARENT_OF',
  CONTAINS = 'CONTAINS',
  HAS_COMMIT = 'HAS_COMMIT',
}

export interface DeveloperNodeDto {
  id: string;
  email: string;
  name: string;
  createdAt?: Date;
}

export interface FileNodeDto {
  id: string;
  repositoryId: string;
  path: string;
  createdAt?: Date;
}

export interface CommitNodeDto {
  id: string;
  repositoryId: string;
  hash: string;
  authoredAt: Date;
  message: string;
  createdAt?: Date;
}

export interface GraphEdgeDto {
  id?: string;
  repositoryId: string;
  sourceId: string;
  targetId: string;
  type: GraphEdgeTypeDto;
  createdAt?: Date;
}
