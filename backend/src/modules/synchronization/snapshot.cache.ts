/**
 * Snapshot Cache Abstraction (In-Memory Store)
 *
 * Purpose:
 *   Provides an encapsulated, type-safe in-memory caching layer for active
 *   repository snapshots. Replaces raw Map usage in SnapshotService to allow
 *   seamless future evolution (e.g., LRU eviction policies, TTL expiration,
 *   or distributed caching via Redis) without altering business logic.
 */

import { RepositorySnapshot } from './snapshot.types';

export class SnapshotCache {
  private readonly store: Map<string, RepositorySnapshot> = new Map();

  /**
   * Retrieves a cached snapshot by repository ID.
   */
  get(repositoryId: string): RepositorySnapshot | undefined {
    return this.store.get(repositoryId);
  }

  /**
   * Stores or updates a snapshot in the cache.
   */
  set(repositoryId: string, snapshot: RepositorySnapshot): void {
    this.store.set(repositoryId, snapshot);
  }

  /**
   * Checks if a snapshot exists in the cache.
   */
  has(repositoryId: string): boolean {
    return this.store.has(repositoryId);
  }

  /**
   * Removes a specific snapshot from the cache.
   */
  delete(repositoryId: string): boolean {
    return this.store.delete(repositoryId);
  }

  /**
   * Clears all cached snapshots.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Returns the current number of cached snapshots.
   */
  get size(): number {
    return this.store.size;
  }
}
