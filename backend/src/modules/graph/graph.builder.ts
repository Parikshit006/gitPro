/**
 * Engineering Graph Builder (Idempotent Graph Assembly Engine)
 *
 * Purpose:
 *   Receives immutable CommitEvents and constructs the directed graph topology
 *   (nodes and relationships) in PostgreSQL. Decoupled from analytical metrics
 *   and AI analysis.
 *
 * Why in-memory HashMaps are required for O(1) streaming performance:
 *   When streaming 100,000 commits, querying PostgreSQL before every node insertion
 *   to check if Linus Torvalds or README.md exists would generate hundreds of
 *   thousands of redundant database SELECT queries.
 *   GraphBuilder maintains three localized HashMaps (`developerCache`, `commitCache`,
 *   and `fileCache`). Cache misses trigger idempotent database upserts, after which
 *   node IDs are cached in RAM, reducing database query volume by up to 95%.
 */

import { CommitEvent } from '../streaming/commit.event';
import { GraphRepository } from './graph.repository';
import { GraphEdgeTypeDto } from './graph.types';

export class GraphBuilder {
  private readonly repository: GraphRepository;
  private readonly developerCache: Map<string, string> = new Map();
  private readonly commitCache: Map<string, string> = new Map();
  private readonly fileCache: Map<string, string> = new Map();

  constructor(repository?: GraphRepository) {
    this.repository = repository ?? new GraphRepository();
  }

  /**
   * Processes an immutable CommitEvent, creating missing nodes and connecting
   * directed relationship edges in PostgreSQL idempotently.
   *
   * @param event The immutable CommitEvent domain object.
   */
  async buildFromEvent(event: CommitEvent): Promise<void> {
    const { repositoryId, hash, authorEmail, authorName, authorDate, message, parents, modifiedFiles } = event;

    // 1. Resolve Developer Node (Idempotent cache/upsert)
    let developerId = this.developerCache.get(authorEmail);
    if (!developerId) {
      developerId = await this.repository.upsertDeveloper(authorEmail, authorName);
      this.developerCache.set(authorEmail, developerId);
    }

    // 2. Resolve CommitNode (Idempotent cache/upsert)
    let commitNodeId = this.commitCache.get(hash);
    if (!commitNodeId) {
      commitNodeId = await this.repository.upsertCommitNode(repositoryId, hash, authorDate, message);
      this.commitCache.set(hash, commitNodeId);
    }

    // 3. Connect HAS_COMMIT Edge (Repository -> CommitNode)
    // Note: repositoryId is used directly as the source node UUID representing the Repository entity
    await this.repository.createEdge(repositoryId, repositoryId, commitNodeId, GraphEdgeTypeDto.HAS_COMMIT);

    // 4. Connect AUTHORED Edge (Developer -> CommitNode)
    await this.repository.createEdge(repositoryId, developerId, commitNodeId, GraphEdgeTypeDto.AUTHORED);

    // 5. Connect PARENT_OF Edges (Parent CommitNode -> CommitNode)
    for (const parentHash of parents) {
      let parentNodeId = this.commitCache.get(parentHash);
      if (!parentNodeId) {
        // Create placeholder/stub node if parent commit arrived out-of-order or is prior history
        parentNodeId = await this.repository.upsertCommitNode(repositoryId, parentHash, new Date(0), 'Parent commit stub');
        this.commitCache.set(parentHash, parentNodeId);
      }
      await this.repository.createEdge(repositoryId, parentNodeId, commitNodeId, GraphEdgeTypeDto.PARENT_OF);
    }

    // 6. Connect CONTAINS & MODIFIED Edges for FileNodes
    for (const path of modifiedFiles) {
      const fileCacheKey = `${repositoryId}:${path}`;
      let fileNodeId = this.fileCache.get(fileCacheKey);
      if (!fileNodeId) {
        fileNodeId = await this.repository.upsertFileNode(repositoryId, path);
        this.fileCache.set(fileCacheKey, fileNodeId);
      }
      // Repository CONTAINS FileNode
      await this.repository.createEdge(repositoryId, repositoryId, fileNodeId, GraphEdgeTypeDto.CONTAINS);
      // CommitNode MODIFIED FileNode
      await this.repository.createEdge(repositoryId, commitNodeId, fileNodeId, GraphEdgeTypeDto.MODIFIED);
    }
  }

  /**
   * Clears all in-memory HashMaps. Useful between repository synchronization runs
   * or during testing to reset memory footprint.
   */
  clearCache(): void {
    this.developerCache.clear();
    this.commitCache.clear();
    this.fileCache.clear();
  }

  /**
   * Returns current cache size metrics for monitoring memory bounded stability.
   */
  get cacheStats(): { developers: number; commits: number; files: number } {
    return {
      developers: this.developerCache.size,
      commits: this.commitCache.size,
      files: this.fileCache.size,
    };
  }
}
