/**
 * Metric Registry (Plugin Lifecycle & Discovery Layer)
 *
 * Purpose:
 *   Centralized container for registering and retrieving metric plugins.
 *   Ensures that metrics remain modular and decoupled from the engine.
 *   Future analytical modules (Knowledge Islands, Temporal Coupling) register
 *   here without modifying MetricEngine or core orchestration code.
 */

import { IMetricPlugin } from './metric.types';

export class MetricRegistry {
  private readonly plugins: Map<string, IMetricPlugin> = new Map();

  /**
   * Registers a new metric plugin. Overwrites if a plugin with the same name exists.
   *
   * @param plugin Instance implementing IMetricPlugin.
   */
  register(plugin: IMetricPlugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * Unregisters a metric plugin by name.
   *
   * @param name Unique metric name.
   * @returns True if removed, false if not found.
   */
  unregister(name: string): boolean {
    return this.plugins.delete(name);
  }

  /**
   * Retrieves a registered plugin by name.
   */
  get(name: string): IMetricPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Returns an array of all currently registered metric plugins.
   */
  getAll(): IMetricPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Returns total count of registered plugins.
   */
  get count(): number {
    return this.plugins.size;
  }
}
