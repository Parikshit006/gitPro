# Unified Search Module (`src/modules/search/`)

## Overview

The **Unified Search Module** provides a high-level, cross-domain query engine over GitPro's existing engineering knowledge base. It enables rapid discovery across repositories, developers, code hotspots, ownership distribution, engineering health evaluations, and prescriptive recommendations through a single standardized query interface supporting keyword matching, multi-dimensional filtering, directional sorting, and slicing pagination.

Currently implemented components:
1. **`search.types.ts`**: Immutable DTOs defining search entity targets, query filters, sorting parameters, pagination requests, domain-specific search result envelopes, and the consolidated `UnifiedSearchResponse`.
2. **`search.repository.ts`**: Unified retrieval facade that strictly delegates data gathering to existing domain repositories (`DashboardRepository`, `InsightRepository`, `MetricRepository`, and `RepositoryRepository`) without executing raw SQL or modifying database schemas.
3. **`search.mapper.ts`**: Pure transformation layer converting raw persistence records and domain insight evaluations into immutable, JSON-serializable search result DTOs.
4. **`search.service.ts`**: Core orchestration engine coordinating multi-repository retrieval, insight evaluation via `InsightService`, in-memory keyword matching, structured property filtering, dynamic sorting, and array slicing pagination.

---

## Architectural Principles & Strict Isolation Rules

### 1. Why Search Consumes Only Existing Repositories
In GitPro's layered architecture, database access patterns are strictly isolated within domain-owned persistence boundaries:
```
[Search Service] ──► [Search Repository] ──► [DashboardRepository & InsightRepository] ──► [PostgreSQL]
```
- **Zero Raw Prisma Queries**: `SearchRepository` **never imports `@prisma/client` or invokes `prisma.*.findMany()` directly**. Writing new ad-hoc queries across database tables in the search layer would bypass domain-level parsing, type casting, and data validation rules established by existing repositories.
- **Zero Git or Graph Access**: The search engine **never accesses disk clones, git repositories, or raw commit trees**. It searches over verified, pre-indexed historical snapshots and precalculated metric results.
- **Zero Metric Calculations**: Search **never calculates algorithmic scores** (such as Bus Factor or Hotspot ranks). It consumes already-evaluated metrics and insights.

### 2. Separation of Responsibilities
- **`SearchRepository` (Only Retrieval)**: Acts as a clean facade over existing repositories. It owns zero business logic, zero filtering logic, and zero DTO conversion.
- **`SearchService` (Only Orchestration)**: Receives search requests, coordinates data gathering across repositories, invokes `InsightService` for health and recommendation evaluations, and executes keyword substring matching, filtering, sorting, and pagination.
- **`SearchMapper` (Only DTO Conversion)**: Converts raw domain models into presentation-ready DTOs, isolating search consumers from underlying database structure or ORM types.

---

## Search Execution Flow

```
[HTTP Request / Controller / Client]
                  │
                  ├─ 1. Invoke SearchService.search(query)
                  ▼
          [SearchService]
                  │
                  ├─ 2. Identify target entities (REPOSITORY, DEVELOPER, HEALTH, HOTSPOT, OWNERSHIP, INSIGHT)
                  ├─ 3. Delegate retrieval to SearchRepository & evaluation to InsightService
                  ▼
        [SearchRepository] ──────► [Dashboard, Insight & Repository Repositories]
                  │                                         │
                  ▼                                         ▼
         (Raw Domain Records) ◄──────────────────── (PostgreSQL DB)
                  │
                  ├─ 4. Apply keyword substring matching across target text fields
                  ├─ 5. Apply multi-dimensional filters (repositoryId, riskLevel, minScore, maxScore)
                  ├─ 6. Apply directional sorting (asc / desc)
                  ├─ 7. Execute pagination slicing (page, pageSize) & calculate metadata
                  ▼
         [SearchMapper]
                  │
                  ├─ 8. Transform filtered records into immutable Search DTOs
                  ▼
     [UnifiedSearchResponse DTO] ──► [Returned to Caller]
```
