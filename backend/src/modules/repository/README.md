# Repository Module

## Purpose

The Repository module is responsible for **registering** GitHub repositories
within the GitPro platform. Registration involves accepting a GitHub URL,
validating it, verifying the repository exists via GitHub's REST API,
persisting its metadata, and returning the registered record.

This module does **not** clone repositories, parse Git history, compute
metrics, or construct graphs. Those responsibilities belong to future
phases of the ingestion pipeline.

## Responsibilities

| Layer                    | Responsibility                                                    |
| ------------------------ | ----------------------------------------------------------------- |
| `repository.types.ts`    | Domain interfaces, status enum, DTOs                              |
| `repository.repository.ts` | Prisma persistence — `create`, `findByGitHubId`, `findById`, `findByFullName`, `updateStatus` |
| `repository.service.ts`  | URL validation, normalization, duplicate detection, GitHub API metadata fetch, orchestration |
| `repository.controller.ts` | HTTP transport — reads request body, calls service, returns `ApiResponse` |
| `repository.routes.ts`   | Route declaration — `POST /api/v1/repositories`                   |

## Boundaries

- **No Prisma outside the repository layer.** The service and controller
  never import `@prisma/client` or the shared Prisma instance.
- **No HTTP inside the service layer** (from Express). The service does
  call the GitHub API via `fetch`, but it never touches `req`, `res`,
  or `next`. It remains transport-agnostic for the application protocol.
- **No business logic inside the controller.** The controller extracts
  the URL from the body, delegates to the service, and formats the
  response. Validation, deduplication, and API calls are the service's
  concern.
- **No cloning, analysis, or metrics.** This module ends at registration.

## API

### `POST /api/v1/repositories`

**Request Body:**
```json
{
  "url": "https://github.com/facebook/react"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Repository registered successfully",
  "statusCode": 201,
  "timestamp": "2026-07-26T12:00:00.000Z",
  "data": {
    "id": "uuid",
    "githubId": "10270250",
    "owner": "facebook",
    "name": "react",
    "fullName": "facebook/react",
    "defaultBranch": "main",
    "visibility": "public",
    "cloneUrl": "https://github.com/facebook/react.git",
    "sizeKb": 382794,
    "language": "JavaScript",
    "description": "The library for web and native user interfaces.",
    "status": "REGISTERED",
    "registeredById": null,
    "createdAt": "...",
    "updatedAt": "...",
    "lastSyncedAt": null
  }
}
```

**Error Responses:**

| Code | Condition                            |
| ---- | ------------------------------------ |
| 400  | Invalid or malformed URL             |
| 404  | Repository not found on GitHub       |
| 409  | Repository already registered        |
| 500  | Unexpected failure                   |

## Future Phases

- **Phase 2 — Repository Cloning:** Clone the registered repository to
  local/cloud storage for Git history analysis.
- **Phase 3 — Git History Parsing:** Walk commit history, extract diffs,
  and compute per-file and per-author metrics.
- **Phase 4 — Graph Construction:** Build dependency and contribution
  graphs from parsed data.
- **Phase 5 — AI Analysis:** Apply machine learning models to extracted
  engineering intelligence data.

## Status Lifecycle

```
REGISTERED → SYNCING → READY
                ↓
              FAILED
```

- `REGISTERED` — URL accepted, metadata persisted. No sync has occurred.
- `SYNCING` — A background job is actively cloning and parsing.
- `READY` — All data has been ingested and is available for queries.
- `FAILED` — The most recent sync attempt failed. Eligible for retry.
