# Incremental Synchronization Engine (`src/modules/synchronization/`)

## Overview

The **Incremental Synchronization Engine** is responsible for detecting repository updates and preparing only new commits for downstream analysis in GitPro. It acts as the bridge between raw filesystem Git operations (Phase 2) and commit streaming engines (Phase 4), ensuring that re-synchronizing an active repository takes milliseconds rather than minutes.

---

## Architectural Principles

### 1. Why Snapshots Exist
In GitPro, `Repository` records store static registration metadata (owner, name, clone URL) fetched from GitHub's REST API at registration time. A **`RepositorySnapshot`** represents the point-in-time state of the physical Git database on disk after a sync cycle. Separating registration from synchronization snapshots provides:
- **Decoupled Lifecycle**: A repository can be registered once, but synchronized thousands of times.
- **Historical Auditability**: Snapshots record commit progression (`commitCount`), default branch shifts, analysis schema versioning (`analysisVersion`), and timestamps without mutating registration identity.
- **Analysis Checkpointing**: Snapshots store `lastAnalyzedCommit`, allowing AI mining pipelines to track precisely which commits have already been processed.

### 2. Why HEAD Comparison is Sufficient
Git guarantees cryptographic immutability: a commit hash (SHA-1 / SHA-256) uniquely identifies not only the contents of that commit, but its entire ancestor graph.
- When `oldHead === newHead`, it is mathematically impossible for any new commits to have been introduced in the active branch. We can safely abort further work and return `NO_CHANGES` immediately.
- When `oldHead !== newHead`, we know history has progressed. We do not need to parse or read individual commits to detect this change.

### 3. Why Incremental Synchronization Reduces Complexity
Without incremental sync, an analysis engine must re-evaluate every commit in a repository on every run. For large repositories (e.g., React, Linux kernel with 100,000+ commits), this causes massive disk I/O and processing bottlenecks.
By caching snapshots in an in-memory `SnapshotCache` abstraction and comparing HEAD hashes, our engine isolates **only the new commits introduced since the last sync**. The workload scales with delta size ($O(\text{new commits})$) rather than total repository size ($O(\text{total commits})$).

### 4. How Commit Streaming Will Consume the Result
The engine returns a `SynchronizationReport` containing explicit `oldHead` and `newHead` markers:
- **First Sync**: `oldHead: null`, `newHead: "<current-sha>"` (stream all commits up to HEAD).
- **Incremental Sync**: `oldHead: "<previous-sha>"`, `newHead: "<current-sha>"` (stream commits in the revision range `oldHead..newHead`).

These markers plug directly into Git streaming commands (`git log oldHead..newHead` or `git rev-list oldHead..newHead`) in Phase 4 without modification. The streaming process reads commits line-by-line via Node.js streams, maintaining a constant memory footprint without ever materializing an array of commit objects in memory.

---

## Data Structures & Complexity Analysis

### In-Memory Cache (`SnapshotCache`)
```
SnapshotCache (Encapsulated Map<string, RepositorySnapshot>)
   ├── "repo-uuid-1" ──> { headCommit: "a1b2c3...", analysisVersion: 1, ... }
   └── "repo-uuid-2" ──> { headCommit: "d4e5f6...", analysisVersion: 1, ... }
```
- **Commit hashes** are stored strictly as immutable strings.
- **No commit arrays** or commit graphs are materialized in memory.
- **Encapsulated Cache**: Replaces raw Map usage to allow future evolution (e.g., LRU eviction or Redis backing) without modifying business logic.

### Complexity Matrix

| Operation / Metric | Complexity | Explanation |
| :--- | :--- | :--- |
| **First Synchronization Time** | $O(\text{total commits})$ | Network and disk I/O to clone full Git history. Zero commit parsing in memory. |
| **Subsequent Sync Time** | $O(\text{new commits})$ | Network and disk I/O to fetch new remote objects. O(1) HEAD hash check. |
| **Space Complexity (Memory)** | $O(1)$ **Streaming-Friendly** | Only string hashes and metadata are held in memory. |
