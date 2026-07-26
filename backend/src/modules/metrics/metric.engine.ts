/**
 * Metric Engine (Sequential Execution & Orchestration Layer)
 *
 * Purpose:
 *   Orchestrates execution of registered metric plugins against a consolidated
 *   Engineering Knowledge Graph snapshot. Persists all resulting calculations
 *   via MetricRepository.
 *
 * Why sequential execution is mandated:
 *   Executing plugins sequentially guarantees deterministic memory usage ($O(V+E)$)
 *   and prevents CPU spikes on large 100,000-commit graphs.
 *   Furthermore, metrics must remain mutually independent and never know about or
 *   depend on each other's execution order or intermediate results.
 */

import { EngineeringGraphContext, MetricResultDto } from './metric.types';
import { MetricRegistry } from './metric.registry';
import { MetricRepository } from './metric.repository';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class MetricEngine {
  private readonly registry: MetricRegistry;
  private readonly repository: MetricRepository;

  constructor(registry: MetricRegistry, repository?: MetricRepository) {
    this.registry = registry;
    this.repository = repository ?? new MetricRepository();
  }

  /**
   * Sequentially executes all registered metric plugins against the provided
   * graph context and persists every calculation result in PostgreSQL.
   *
   * @param graph In-memory snapshot of repository topology nodes and edges.
   * @returns Combined array of all generated MetricResult DTOs.
   */
  async runAll(graph: EngineeringGraphContext): Promise<MetricResultDto[]> {
    const plugins = this.registry.getAll();
    if (plugins.length === 0) {
      return [];
    }

    const allResults: MetricResultDto[] = [];

    for (const plugin of plugins) {
      try {
        const results = await plugin.compute(graph);
        allResults.push(...results);
      } catch (error: any) {
        throw new AppError(
          `Metric plugin '${plugin.name}' failed during execution: ${error?.message || 'Unknown error'}`,
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          true,
        );
      }
    }

    if (allResults.length > 0) {
      await this.repository.saveMany(allResults);
    }

    return allResults;
  }

  /**
   * Executes a single specific metric plugin by name and persists its results.
   *
   * @param metricName Name of the registered plugin (e.g., 'bus-factor').
   * @param graph In-memory snapshot of repository topology.
   * @returns Array of generated MetricResult DTOs.
   */
  async runMetric(metricName: string, graph: EngineeringGraphContext): Promise<MetricResultDto[]> {
    const plugin = this.registry.get(metricName);
    if (!plugin) {
      throw new AppError(`Metric plugin '${metricName}' is not registered in MetricRegistry`, HTTP_STATUS.NOT_FOUND, true);
    }

    try {
      const results = await plugin.compute(graph);
      if (results.length > 0) {
        await this.repository.saveMany(results);
      }
      return results;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        `Metric plugin '${metricName}' failed during execution: ${error?.message || 'Unknown error'}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        true,
      );
    }
  }

  /**
   * Accessor to the underlying MetricRegistry for dynamic registration.
   */
  get getRegistry(): MetricRegistry {
    return this.registry;
  }
}
