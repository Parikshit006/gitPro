# Commit Streaming Engine (`src/modules/streaming/`)

## Overview

The **Commit Streaming Engine** is responsible for converting Git commit history into a stream of immutable `CommitEvent` domain objects using constant-memory ($O(1)$) streaming and lightweight in-process publish/subscribe mechanics. It acts as the data generation backbone for GitPro, delivering commit events to downstream analytical pipelines without ever accumulating commits in memory arrays or touching database ORM layers.

---

## Architectural & Design Principles

### 1. Why Streaming?
In enterprise repositories (e.g., Linux kernel, React, VS Code), commit history contains anywhere from 50,000 to over 1,000,000 commits. Loading an entire repository's git log into application RAM causes massive heap spikes, out-of-memory crashes, and garbage collection pauses.
By utilizing Node.js streams and child process piping, our engine processes commit logs line-by-line and record-by-record. Memory consumption remains strictly bounded ($O(1)$) whether streaming 10 commits or 100,000 commits.

### 2. Why Pub/Sub?
The `CommitEventPublisher` implements an in-process publish/subscribe pattern to decouple data generation from data consumption.
- **Dynamic Extensibility**: In future sprints, downstream engines (Engineering Graph Builder, Metrics Engine, Raw Event Store, AI Engine) can attach themselves as consumers via `subscribe()`.
- **Zero Coupling**: The `CommitStreamService` does not know which consumers exist or what they do with the data. It simply pushes immutable events into the publisher pipeline.

### 3. Why Immutable Events?
A `CommitEvent` represents an unchangeable historical fact: a commit that occurred in Git.
- **Concurrency Safety**: Multiple subscribers receive the exact same event instance concurrently. Enforcing runtime immutability via `Object.freeze(this)` and `Object.freeze(parents)` guarantees that an AI mining subscriber cannot accidentally mutate a commit's author or message before the Metrics Engine processes it.
- **Domain Purity**: Decoupled from Prisma, ORM annotations, and SQL schemas. It is a pure domain entity.

### 4. Why No Arrays?
Accumulating commit objects in an array (`const commits = []`) destroys streaming benefits by shifting space complexity back to $O(N)$. Our engine strictly avoids array accumulation. As soon as a `CommitEvent` is parsed and published to subscribers, it is dereferenced and garbage collected by V8 immediately.

---

## Streaming Algorithm & Backpressure Control

```
[ Git Child Process ] ──stdout (Readable)──► [ CommitParser ] ──CommitEvent──► [ CommitEventPublisher ]
       ▲                                            │                                   │
       │                                            ▼                                   ▼
       └────────────── stream.pause() ◄─── (await consumer processing) ────► [ Multiple Consumers ]
```

1. **Delimited Stream Generation**: `GitClient.streamCommitLog()` spawns a `git log` child process using custom non-printable ASCII delimiters:
   - Field Separator: `0x1F` (ASCII Unit Separator)
   - Record Separator: `0x1E` (ASCII Record Separator)
   This ensures foolproof splitting even when commit messages contain special Markdown characters, quotes, or multi-line paragraphs.
2. **Chunk Slicing**: As `stdout` data chunks arrive in `CommitParser`, records are sliced immediately on `0x1E` boundaries. Sliced strings are removed from the buffer instantly to prevent string memory bloat.
3. **Backpressure Enforcement**: Before invoking `onCommit(event)`, the parser calls `stream.pause()` on the git readable stream. If an asynchronous subscriber (e.g., a database writer or network stream) takes time to process the event, pausing the child process prevents Node.js from buffering stdout chunks in RAM. Once all subscribers finish, `stream.resume()` is called.

---

## Complexity Matrix

| Operation / Metric | Complexity | Explanation |
| :--- | :--- | :--- |
| **Time Complexity** | $O(C)$ where $C$ is commit count | Each commit in the revision window is parsed and delivered exactly once. |
| **Space Complexity** | $O(1)$ **Constant Memory** | At any given microsecond, memory holds only: (1) a single `CommitEvent` being processed, (2) a small unfinished stdout buffer (< 8 KB), and (3) consumer subscription callbacks. |
| **Pub/Sub Delivery** | $O(S)$ where $S$ is subscribers | Each published event is distributed concurrently to all registered consumers. |
