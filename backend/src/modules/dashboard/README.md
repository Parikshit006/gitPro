# Dashboard Module (`src/modules/dashboard/`)

## Overview

The **Dashboard Module** serves as the presentation and reporting layer of the GitPro Engineering Intelligence Platform. It bridges raw persistence stores (repositories, commit events, graph nodes, and precomputed analytical metrics) with frontend client user interfaces.

Currently implemented components:
1. **`dashboard.types.ts`**: Pure, frontend-facing Data Transfer Object (DTO) contracts and API payload wrappers.
2. **`dashboard.repository.ts`**: Dedicated data retrieval repository owning all Prisma database queries required by dashboard reporting.
3. **`dashboard.mapper.ts`**: Pure, deterministic transformation layer converting raw persistence models into immutable DTOs.
4. **`dashboard.service.ts`**: Orchestration service coordinating multi-source data retrieval and delegating DTO assembly to `DashboardMapper`.
5. **`dashboard.controller.ts`**: Thin HTTP transport boundary responsible strictly for request parameter validation, service delegation, and response wrapping.
6. **`dashboard.routes.ts`**: Declarative routing and middleware composition layer mapping HTTP verbs to protected endpoints.

---

## Architectural Principles & Rationale

### 1. Why Routes Are Only Composition Layers
In clean Express architectures, route definitions (`dashboard.routes.ts`) act purely as declarative wiring specifications. They define **what** URL paths trigger **which** controller handlers through a specific pipeline of middleware.
Routes contain zero business logic, zero Prisma queries, zero DTO transformations, and zero HTTP response formatting. Isolating routing declaration into its own layer guarantees that cross-cutting concerns (such as authentication, rate limiting, logging, and validation) can be composed, reordered, or swapped globally without touching controller handlers or service execution logic.

### 2. Why Middleware Order Matters
Express executes middleware sequentially from left to right:
```typescript
router.get('/:id', authenticate, validateParams, controller.getRepositoryOverview);
```
The exact ordering of this pipeline is mission-critical:
1. **`authenticate`**: Must run first. It extracts the JWT from the `Authorization: Bearer <token>` header, verifies HS256 cryptographic signatures via `JwtService`, and attaches the decoded user identity to `req.user`. If the token is missing or expired, execution halts immediately with a `401 Unauthorized` exception.
2. **`validateParams` (Future Validation)**: Runs second. Only after confirming the caller is an authenticated user does the router expend CPU cycles validating Zod schemas, UUID formatting, or pagination boundaries.
3. **`controller.handler`**: Runs last. By the time execution reaches the controller, the request is guaranteed to be fully authenticated and structurally valid.

### 3. Why Authentication Should Execute Before Controllers
If authentication checks were embedded inside controller methods or executed after validation, unauthenticated attackers could trigger database lookups, exhaust CPU via regex parameter parsing, or flood application services with malformed payloads.
Enforcing authentication as the very first middleware in the routing chain establishes a strict **zero-trust perimeter**: unauthenticated requests are rejected at the HTTP network boundary before any controller, service, or repository code is instantiated.

### 4. How Future Validation Middleware Fits Into the Chain
To prepare for upcoming Sprint iterations without refactoring existing routes, explicit placeholder comment blocks (`/* TODO: [Placeholder] Add Zod / Query parameter validation middleware here */`) have been positioned between `authenticate` and controller handlers.
When centralized request validation (e.g., Zod or express-validator middleware) is implemented, developers simply drop the validator function into the placeholder slot:
```typescript
// Future implementation replacing the placeholder comment:
router.get('/repositories', authenticate, validatePaginationQuery, controller.getRepositories);
```

---

## HTTP Routing & Middleware Composition Contract (`dashboard.routes.ts`)

Mounted at `/api/v1/dashboard` in `src/routes/index.ts`:

| HTTP Endpoint | Middleware Pipeline | Target Controller Handler | Protected |
| :--- | :--- | :--- | :--- |
| `GET /api/v1/dashboard/` | `[authenticate, /* Zod Query */]` | `controller.getDashboardOverview` | ✔ Yes |
| `GET /api/v1/dashboard/repositories` | `[authenticate, /* Pagination */]` | `controller.getRepositories` | ✔ Yes |
| `GET /api/v1/dashboard/repositories/:id` | `[authenticate, /* Zod Route Param */]` | `controller.getRepositoryOverview` | ✔ Yes |
| `GET /api/v1/dashboard/repositories/:id/overview` | `[authenticate, /* Zod Route Param */]` | `controller.getRepositoryOverview` | ✔ Yes |
| `GET /api/v1/dashboard/repositories/:id/health` | `[authenticate, /* Zod Route Param */]` | `controller.getRepositoryHealth` | ✔ Yes |
| `GET /api/v1/dashboard/repositories/:id/activity` | `[authenticate, /* Zod Route Param */]` | `controller.getRepositoryActivity` | ✔ Yes |
| `GET /api/v1/dashboard/repositories/:id/hotspots` | `[authenticate, /* Zod Route Param */]` | `controller.getRepositoryHotspots` | ✔ Yes |
| `GET /api/v1/dashboard/repositories/:id/ownership` | `[authenticate, /* Zod Route Param */]` | `controller.getRepositoryOwnership` | ✔ Yes |
| `GET /api/v1/dashboard/repositories/:id/bus-factor`| `[authenticate, /* Zod Route Param */]` | `controller.getRepositoryBusFactor` | ✔ Yes |
