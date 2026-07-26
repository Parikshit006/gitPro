/**
 * Engineering Metrics Service (Graph Consumption & Analytics Orchestrator)
 *
 * Purpose:
 *   Bridges the frozen Engineering Knowledge Graph (Phase 1) with the plugin-based
 *   Engineering Metrics Engine (Phase 2).
 *   Loads repository topology into a consolidated in-memory context once per analysis
 *   run and executes all registered plugins without duplicate database scans.
 */

import { prisma } from '../../lib/prisma';
import { GraphMapper } from '../graph/graph.mapper';
import { EngineeringGraphContext, MetricResultDto } from './metric.types';
import { MetricRegistry } from './metric.registry';
import { MetricEngine } from './metric.engine';
import { MetricRepository } from './metric.repository';
import { BusFactorMetric } from './metrics/bus-factor.metric';
import { OwnershipMetric } from './metrics/ownership.metric';
import { HotspotMetric } from './metrics/hotspot.metric';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class MetricService {
  private readonly registry: MetricRegistry;
  private readonly engine: MetricEngine;
  private readonly repository: MetricRepository;
  private readonly graphMapper: GraphMapper;

  constructor() {
    this.registry = new MetricRegistry();
    this.repository = new MetricRepository();
    this.engine = new MetricEngine(this.registry, this.repository);
    this.graphMapper = new GraphMapper();

    // Automatically register initial core structural metrics
    this.registerCoreMetrics();
  }

  private registerCoreMetrics(): void {
    this.registry.register(new BusFactorMetric());
    this.registry.register(new OwnershipMetric());
    this.registry.register(new HotspotMetric());
  }

  /**
   * Loads the complete Engineering Knowledge Graph snapshot for a repository
   * and sequentially executes all registered metric plugins.
   *
   * @param repositoryId UUID of the target repository.
   * @returns Array of all newly persisted MetricResult DTOs.
   */
  async analyzeRepository(repositoryId: string): Promise<MetricResultDto[]> {
    const graphContext = await this.loadGraphContext(repositoryId);
    return await this.engine.runAll(graphContext);
  }

  /**
   * Executes a single specific metric calculation on a repository.
   *
   * @param repositoryId UUID of the target repository.
   * @param metricName Name of the registered plugin (e.g., 'bus-factor').
   */
  async runSingleMetric(repositoryId: string, metricName: string): Promise<MetricResultDto[]> {
    const graphContext = await this.loadGraphContext(repositoryId);
    return await this.engine.runMetric(metricName, graphContext);
  }

  /**
   * Loads repository graph nodes and edges into a localized in-memory context.
   * Avoids repeated database table scans across sequential plugin executions.
   */
  async loadGraphContext(repositoryId: string): Promise<EngineeringGraphContext> {
    try {
      const [fileNodesRecs, commitNodesRecs, edgesRecs] = await Promise.all([
        prisma.fileNode.findMany({ where: { repositoryId } }),
        prisma.commitNode.findMany({ where: { repositoryId } }),
        prisma.graphEdge.findMany({ where: { repositoryId } }),
      ]);

      // Discover active developer UUIDs from AUTHORED edges in this repository
      const devIds = new Set<string>();
      for (const edge of edgesRecs) {
        if (edge.type === 'AUTHORED') {
          devIds.add(edge.sourceId);
        }
      }

      const devsRecs = devIds.size > 0 ? await prisma.developer.findMany({ where: { id: { in: Array.from(devIds) } } }) : [];

      return {
        repositoryId,
        developers: devsRecs.map((r) => this.graphMapper.toDeveloperDto(r)),
        fileNodes: fileNodesRecs.map((r) => this.graphMapper.toFileNodeDto(r)),
        commitNodes: commitNodesRecs.map((r) => this.graphMapper.toCommitNodeDto(r)),
        edges: edgesRecs.map((r) => this.graphMapper.toGraphEdgeDto(r)),
      };
    } catch (error: any) {
      throw new AppError(
        `Failed to load Engineering Graph context for repository ${repositoryId}: ${error?.message || 'Unknown error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Retrieves stored metric results from PostgreSQL for a repository.
   */
  async getResults(repositoryId: string, metricName?: string): Promise<MetricResultDto[]> {
    const recs = await this.repository.findByRepository(repositoryId, metricName);
    return recs.map((r) => ({
      id: r.id,
      repositoryId: r.repositoryId,
      metricName: r.metricName,
      entityType: r.entityType,
      entityId: r.entityId,
      score: r.score,
      metadata: r.metadata ?? undefined,
      calculatedAt: r.calculatedAt ? new Date(r.calculatedAt) : undefined,
    }));
  }

  /**
   * Retrieves stored metric results targeting a specific entity.
   */
  async getEntityResults(repositoryId: string, entityType: string, entityId: string): Promise<MetricResultDto[]> {
    const recs = await this.repository.findByEntity(repositoryId, entityType, entityId);
    return recs.map((r) => ({
      id: r.id,
      repositoryId: r.repositoryId,
      metricName: r.metricName,
      entityType: r.entityType,
      entityId: r.entityId,
      score: r.score,
      metadata: r.metadata ?? undefined,
      calculatedAt: r.calculatedAt ? new Date(r.calculatedAt) : undefined,
    }));
  }

  get getRegistry(): MetricRegistry {
    return this.registry;
  }
}
