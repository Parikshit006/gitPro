/**
 * Engineering Metrics Domain Types & Interfaces (Sprint 4 Phase 2)
 *
 * Purpose:
 *   Defines interfaces for metric plugins, calculation output DTOs, and the
 *   consolidated graph context used for linear, non-recursive topology scans.
 */

import { DeveloperNodeDto, FileNodeDto, CommitNodeDto, GraphEdgeDto } from '../graph/graph.types';

export interface EngineeringGraphContext {
  readonly repositoryId: string;
  readonly developers: ReadonlyArray<DeveloperNodeDto>;
  readonly fileNodes: ReadonlyArray<FileNodeDto>;
  readonly commitNodes: ReadonlyArray<CommitNodeDto>;
  readonly edges: ReadonlyArray<GraphEdgeDto>;
}

export interface MetricResultDto {
  id?: string;
  repositoryId: string;
  metricName: string;
  entityType: string; // e.g., 'REPOSITORY', 'FILE', 'DEVELOPER'
  entityId: string;   // e.g., repo uuid, file path, author email
  score: number;
  metadata?: Record<string, any>;
  calculatedAt?: Date;
}

export interface IMetricPlugin {
  readonly name: string;
  compute(graph: EngineeringGraphContext): Promise<MetricResultDto[]> | MetricResultDto[];
}
