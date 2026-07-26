# Engineering Metrics Framework (`src/modules/metrics/`)

## Overview

The **Engineering Metrics Framework** (Sprint 4 Phase 2) is a generic, plugin-based analytics engine that consumes the frozen Engineering Knowledge Graph (`src/modules/graph/`) and calculates high-value engineering intelligence metrics. It persists all calculated scores and rich metadata into PostgreSQL via a polymorphic `MetricResult` store.

This module introduces three initial structural metric plugins:
1. **Bus Factor** (`bus-factor`): Evaluates maintainer concentration and organizational knowledge risk.
2. **Ownership** (`ownership`): Maps per-file developer authorship percentages.
3. **Hotspots** (`hotspots`): Ranks repository files by modification frequency (churn).

---

## Architectural & Design Principles

### 1. Why a Plugin Architecture?
Engineering intelligence is an evolving domain. As new analytical models (e.g., Knowledge Islands, Temporal Coupling, Code Reviewer Recommendation) are developed in future sprints, hardcoding calculation algorithms directly into a monolithic service would cause rapid degradation of maintainability and testability.
By defining a clean interface (`IMetricPlugin`) and managing lifecycle via `MetricRegistry`:
- **Decoupling**: Each plugin is a standalone, self-contained unit that knows nothing about other plugins or the database layer.
- **Extensibility**: Adding a new metric requires creating a single class and registering it in `MetricRegistry`—zero modifications to `MetricEngine`, `MetricService`, or data persistence schemas are required.
- **Fault Isolation**: If an experimental AI or coupling plugin throws an error, the engine catches it and isolates the failure, ensuring other core structural metrics continue executing reliably.

### 2. Why a Generic `MetricResult` Table?
Traditional reporting systems often create dedicated database tables for each metric (e.g., `bus_factor_results`, `file_ownership_results`, `hotspot_rankings`). This approach creates severe schema sprawl: adding 10 new metrics would require 10 database migrations, 10 new ORM models, and 10 custom query repositories.
The `MetricResult` table utilizes a **polymorphic entity schema**:
- `metricName`: Discriminates the analytical plugin (`bus-factor`, `ownership`, `hotspots`).
- `entityType` & `entityId`: Polymorphically targets any domain level (`REPOSITORY`, `FILE`, `DEVELOPER`).
- `score` & `metadata`: Captures primary numerical ranking alongside rich JSON context (e.g., author breakdowns, contribution thresholds).
This design allows infinite analytical scalability with zero schema migrations.

### 3. How Future Metrics Integrate Without Engine Modification
When implementing future analytical capabilities (such as **Knowledge Islands** or **Temporal Coupling**):
1. Implement `IMetricPlugin` in a new file (e.g., `temporal-coupling.metric.ts`):
   ```typescript
   export class TemporalCouplingMetric implements IMetricPlugin {
     readonly name = 'temporal-coupling';
     compute(graph: EngineeringGraphContext): MetricResultDto[] {
       // Traverse graph.edges linearly to find files committed together
     }
   }
   ```
2. Register the plugin: `registry.register(new TemporalCouplingMetric())`.
3. When `MetricService.analyzeRepository()` runs, `MetricEngine.runAll()` automatically iterates over the new plugin, executes it against the consolidated in-memory graph context, and atomically persists the resulting records in `metric_results`.

---

## Architecture & Data Flow

```
Engineering Graph (Frozen Topology Layer: Nodes & Edges)
   │
   ▼  [ 4 Concurrent Indexed Queries ]
MetricService (Orchestrator)
   │
   ▼  [ In-Memory EngineeringGraphContext ]
MetricEngine (Sequential Execution Orchestrator)
   ├──► BusFactorMetric.compute(graph) ──► [ O(V + E) Linear Traversal ]
   ├──► OwnershipMetric.compute(graph) ──► [ O(V + E) Linear Traversal ]
   └──► HotspotMetric.compute(graph)   ──► [ O(V + E) Linear Traversal & Sort ]
   │
   ▼  [ Combined Array of MetricResultDto ]
MetricRepository (Transactional Snapshot Replacement)
   ├──► tx.metricResult.deleteMany()   ──► [ Cleans previous run for (repoId, metricName) ]
   └──► tx.metricResult.createMany()   ──► [ Bulk inserts new calculated snapshot ]
   │
   ▼
PostgreSQL (`metric_results` table)
```

1. **Consolidated Graph Loading**: `MetricService.loadGraphContext()` queries PostgreSQL once per repository to load all nodes and edges into an in-memory `EngineeringGraphContext`. This prevents each plugin from executing duplicate database table scans.
2. **Sequential, Non-Recursive Execution**: Plugins run sequentially over the localized in-memory arrays using HashMaps and priority sorting ($O(V + E)$).
3. **Transactional Snapshot Replacement**: To ensure idempotent re-runs without accumulating duplicate historical records, `MetricRepository.saveMany()` executes a database transaction that deletes the previous snapshot for affected `(repositoryId, metricName)` pairs before inserting the new calculation batch in bulk via `createMany`.

---

## Database Schema (`prisma/schema.prisma`)

```prisma
model MetricResult {
  id           String     @id @default(uuid()) @db.Uuid
  repositoryId String     @map("repository_id") @db.Uuid
  repository   Repository @relation(fields: [repositoryId], references: [id], onDelete: Cascade)
  metricName   String     @map("metric_name")
  entityType   String     @map("entity_type")
  entityId     String     @map("entity_id")
  score        Float
  metadata     Json?
  calculatedAt DateTime   @default(now()) @map("calculated_at")

  @@index([repositoryId])
  @@index([metricName])
  @@index([entityId])
  @@map("metric_results")
}
```

---

## Complexity Matrix

| Metric Plugin / Operation | Time Complexity | Auxiliary Space | Explanation |
| :--- | :--- | :--- | :--- |
| **Graph Context Loading** | $O(V + E)$ | $O(V + E)$ | 4 concurrent indexed B-Tree queries loading nodes ($V$) and edges ($E$) into memory. |
| **Bus Factor (`bus-factor`)** | $O(E + V \log V)$ | $O(V)$ | Linear scan of $E$ edges to map author commit counts, followed by sorting $V$ developers by volume. |
| **Ownership (`ownership`)** | $O(E + F \cdot D)$ | $O(D)$ per file | Linear scan of $E$ edges to accumulate author counts per file ($F$), computing percentages across contributing developers ($D$). |
| **Hotspots (`hotspots`)** | $O(E + F \log F)$ | $O(F)$ | Linear scan of $E$ edges to count file churn, followed by priority sorting $F$ files descending. |
| **Transactional Persistence** | $O(R)$ | $O(1)$ DB overhead | Bulk replacement of $R$ calculated result records inside a single atomic PostgreSQL transaction. |
