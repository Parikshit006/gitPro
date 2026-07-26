# Ingestion Module (Repository Clone Engine)

## Purpose

The Ingestion module is responsible for downloading GitHub repositories to the local filesystem and keeping them synchronized over time. It functions as the caching and synchronization engine of the GitPro platform.

This module is **strictly limited to cloning, fetching, storage path management, and filesystem health verification**. It does **not** implement Git log parsing, commit mining, metrics computation, dependency graphs, or AI code analysis. Those concerns belong to downstream processing phases.

---

## Architecture & Layer Separation

```
RepositoryController (HTTP Transport Layer)
       ↓
RepositoryService (Business Orchestration Layer)
       ↓
CloneService (Repository Caching & Observability Engine)
       ↓
GitClient (simple-git Infrastructure Wrapper)  +  StorageService (Filesystem Path Manager)
       ↓                                                 ↓
Git CLI Binaries                                  Local Filesystem (storage/repositories/)
```

### Responsibilities by Layer

| Component | Responsibility |
|---|---|
| `StorageService` | Owns all filesystem paths, folder hierarchy creation, and disk cleanup. Never uses repository names; always uses internal UUIDs. |
| `GitClient` | Low-level wrapper around `simple-git`. Executes raw `clone`, `fetch`, `revparse`, `checkout`, and repository validation checks. |
| `CloneService` | Enforces the caching strategy (clone if new, fetch if cached), emits structured JSON logs, and performs multi-point health verification. |

---

## Storage Layout

All cloned repositories reside inside a configurable root storage directory, managed via the `REPO_STORAGE_PATH` environment variable (defaulting to `storage/repositories/`).

To prevent naming collisions, folder path renaming errors, and organization clashes, repositories are **never stored by their GitHub name**. They are stored exclusively by their internal GitPro UUID:

```
storage/
└── repositories/
    ├── 7c5f0d1a-8b23-4c91-9e12-3a8b4f6d1e02/
    │   ├── .git/
    │   │   ├── HEAD
    │   │   ├── config
    │   │   └── objects/
    │   ├── src/
    │   ├── package.json
    │   └── README.md
    └── 9a1e4c2b-1f3d-4a88-8b99-5e2d1c3f4a01/
        └── .git/
```

---

## Clone Strategy & Trade-Off Analysis

### Mirror / Bare Clone (`--mirror` or `--bare`)
- **Advantages**: Saves roughly 50% disk space because no physical working directory is checked out. Clones and fetches execute faster. Eliminates file-locking issues on Windows during branch checkouts.
- **Disadvantages**: The repository root IS the Git database (`HEAD`, `refs/`, `objects/` exist directly in the folder), meaning no `.git` subdirectory exists. Reading file contents at specific commits requires `git show <ref>:<path>` or temporary git worktree management.

### Normal Non-Bare Clone (Selected Strategy)
- **Advantages**: Creates a standard working tree with a `.git` database directory and `.git/HEAD` reference file. This **directly satisfies our architectural verification standards** (`Repository exists`, `.git exists`, `HEAD exists`) and allows any future static linters, AST parsers, or file-based AI mining engines to inspect physical files on disk natively without complex worktree orchestration.
- **Disadvantages**: Doubles disk space usage (both `.git` database and checked-out files exist) and requires disk IO during branch switching.
- **Decision**: We use a **normal non-bare clone** to guarantee filesystem verification compatibility and simplify downstream AST mining in future sprints.

---

## Observability & Structured Logging

Every synchronization operation emits structured JSON logs with timestamps, repository identifiers, durations, and disk usage:

```json
{"event":"Clone Started","timestamp":"2026-07-26T21:00:00.000Z","repositoryId":"uuid","fullName":"facebook/react","cloneUrl":"https://github.com/facebook/react.git"}
{"event":"Clone Finished","timestamp":"2026-07-26T21:00:15.000Z","repositoryId":"uuid","fullName":"facebook/react","durationMs":15000,"sizeKb":382794,"head":"4f3a2b1c..."}
```

---

## Future Phases

- **Phase 3 — Git History Parsing**: Walk commit history, extract commit author graphs, and compute file modification metrics.
- **Phase 4 — Graph Construction**: Build contributor dependency and collaboration graphs from ingested Git data.
- **Phase 5 — AI Code Mining**: Execute AST parsers and machine learning models against physical repository codebases.
