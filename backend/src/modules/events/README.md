# Raw Event Store (`src/modules/events/`)

## Overview

The **Raw Event Store** is responsible for persisting every immutable `CommitEvent` streamed from Git history into PostgreSQL exactly once. Once ingested into the Raw Event Store, Git is never reread unless repository disk history changes. It acts as the immutable historical foundation and single source of truth for all future analytical pipelines in GitPro.

---

## Architectural & Design Principles

### 1. Why Raw Event Store Exists
Raw Git history stored in `.git` folders on disk is optimized for version control operations (branching, merging, delta compression), not for analytical querying or multi-tenant database JOINs. The Raw Event Store converts ephemeral filesystem streams into indexed, structured, and auditable PostgreSQL records that can be queried concurrently by multiple microservices without locking or reading disk files.

### 2. Why Git Becomes Ingestion-Only
Spawning Git CLI child processes (`git log`, `git rev-list`) across thousands of repositories under high user concurrency introduces severe CPU overhead, process table exhaustion, and disk I/O bottlenecks.
By restricting Git CLI access exclusively to the initial ingestion and synchronization phase (Phases 2–4), we decouple downstream analytical engines from disk I/O. Future engines (Engineering Graph Builder, Metrics Engine, AI Engine) consume data entirely from PostgreSQL or in-memory caches.

### 3. Why Persistence is Separated from Streaming
The `CommitStreamService` (Phase 4) is a pure, stateless generator designed for high-throughput stream transformation without knowing where data goes. Decoupling the `EventService` from the stream generator allows us to:
- Subscribe or unsubscribe persistence asynchronously without altering streaming mechanics.
- Evolve database schemas (`version` increments, index adjustments) without modifying Git log parsing.
- Support replay and backfilling pipelines cleanly.

---

## Architecture & Data Flow

```
CommitEventPublisher (In-Process Pub/Sub)
   │
   ▼  (subscribe)
EventService (Orchestrator)
   │
   ├──► EventMapper.toPersistenceDto() ──► [ Decoupled DTO (No Prisma Leakage) ]
   │
   ▼
EventRepository.save()
   │
   ▼  (createMany skipDuplicates)
PostgreSQL (commit_events table)
```

1. **Stream Subscription**: `EventService.subscribeToPublisher()` attaches an async callback to the active `CommitEventPublisher`.
2. **Domain Mapping**: As each immutable `CommitEvent` arrives, `EventMapper.toPersistenceDto()` maps domain properties (`authorDate` → `authoredAt`) without exposing Prisma ORM models.
3. **Idempotent Persistence**: `EventRepository.save()` executes `createMany({ data: [dto], skipDuplicates: true })`. This maps to PostgreSQL `INSERT INTO ... ON CONFLICT (hash) DO NOTHING`. Duplicates are silently ignored without throwing exceptions or rolling back transactions.

---

## Database Schema (`commit_events`)

| Column | Type | Constraints / Indexes | Description |
| :--- | :--- | :--- | :--- |
| **`id`** | UUID | `@id @default(uuid())` | Primary key of the stored event record. |
| **`repository_id`** | UUID | Foreign Key → `Repository.id` (`onDelete: Cascade`), Index | Repository ownership relationship. |
| **`hash`** | String | `@unique` | Cryptographically unique Git SHA-1/SHA-256 commit hash. |
| **`parent_hashes`** | JSON | NOT NULL | Array of parent commit SHAs (empty for initial commit). |
| **`author_name`** | String | NOT NULL | Git author identity name. |
| **`author_email`** | String | NOT NULL | Git author email address. |
| **`authored_at`** | DateTime | NOT NULL | Original authorship timestamp (`%aI`). |
| **`committed_at`** | DateTime | Index | Commit timestamp (`%cI`), indexed for chronological sorting. |
| **`message`** | Text | NOT NULL | Full commit message (subject + body). |
| **`version`** | Int | `@default(1)` | Schema/event versioning for future re-mining pipelines. |
| **`created_at`** | DateTime | `@default(now())` | Record insertion timestamp in PostgreSQL. |

---

## Complexity Matrix

| Operation / Metric | Complexity | Explanation |
| :--- | :--- | :--- |
| **Time Complexity (Insert)** | $O(1)$ per event | Single-roundtrip `ON CONFLICT DO NOTHING` SQL execution. |
| **Space Complexity (RAM)** | $O(1)$ **Constant Memory** | Events are streamed and saved individually; zero arrays are accumulated in heap memory. |
| **Duplicate Rejection Time** | $O(1)$ | B-Tree index lookup on unique `hash` column inside PostgreSQL engine during conflict check. |
| **Query by Repository** | $O(\log N + K)$ | Index scan on `(repository_id, committed_at)` retrieving $K$ paginated records. |
