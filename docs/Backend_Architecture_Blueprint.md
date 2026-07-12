# Backend Architecture Blueprint

**Project:** GitPro  
**Architecture:** Domain-Oriented Modular Monolith (Express + TypeScript)  
**Phase:** Sprint 1, Step 2.2  

---

## 1. Folder Architecture

The `backend/` directory is structured to enforce clean architecture principles, separating transport layers (HTTP) from core business logic (Services) and data access (Repositories).

### `config/`
- **Purpose:** Centralized application configuration.
- **Responsibilities:** Loading, validating, and exporting environment variables and application-wide settings.
- **What belongs inside:** Environment parsers, logger configurations, database connection strings, and third-party API key configurations.
- **What must NEVER be placed inside:** Business logic or data access code.
- **Example future files:** `env.config.ts`, `logger.config.ts`, `auth.config.ts`.

### `controllers/`
- **Purpose:** The HTTP transport boundary.
- **Responsibilities:** Extracting data from HTTP requests (params, body, query), passing it to the appropriate Service, and formatting the HTTP response.
- **What belongs inside:** Express Route Handlers, HTTP status code mappings.
- **What must NEVER be placed inside:** Core business logic, direct database calls, or external API calls.
- **Example future files:** `repository.controller.ts`, `analysis.controller.ts`, `auth.controller.ts`.

### `services/`
- **Purpose:** The core business logic engine.
- **Responsibilities:** Executing domain-specific workflows, enforcing business rules, and orchestrating interactions between Repositories and Providers.
- **What belongs inside:** Core algorithmic logic, business validation, and domain orchestrators.
- **What must NEVER be placed inside:** Knowledge of the HTTP context (`req`, `res`), SQL queries, or direct database connections.
- **Example future files:** `repository-ingestion.service.ts`, `metrics-calculation.service.ts`, `report-generation.service.ts`.

### `repositories/`
- **Purpose:** The data access boundary.
- **Responsibilities:** Interacting directly with the database via Prisma ORM and translating database records into domain models.
- **What belongs inside:** Prisma Client calls, complex SQL aggregations, and data mapping logic.
- **What must NEVER be placed inside:** Business logic, external HTTP API calls, or request/response handling.
- **Example future files:** `user.repository.ts`, `analysis-run.repository.ts`, `repository-metadata.repository.ts`.

### `middlewares/`
- **Purpose:** HTTP request interception and lifecycle management.
- **Responsibilities:** Executing logic before a request reaches the controller (e.g., authentication, logging, error catching).
- **What belongs inside:** Auth guards, rate limiters, global error handlers, payload parsers.
- **What must NEVER be placed inside:** Business logic orchestrations.
- **Example future files:** `require-auth.middleware.ts`, `error-handler.middleware.ts`, `rate-limiter.middleware.ts`.

### `routes/`
- **Purpose:** API endpoint registration.
- **Responsibilities:** Mapping HTTP verbs (GET, POST) and URL paths to the corresponding Controllers and Middlewares.
- **What belongs inside:** Express Router definitions.
- **What must NEVER be placed inside:** Request handling logic or business logic.
- **Example future files:** `api.router.ts`, `repository.routes.ts`, `auth.routes.ts`.

### `modules/`
- **Purpose:** Enforcing the Domain-Oriented Modular Monolith structure.
- **Responsibilities:** Modules are mandatory. Every business capability must live inside a module, encapsulating its own routes, controllers, services, and repositories.
- **What belongs inside:** Domain-specific folders. Future modules include: `auth`, `repository`, `analysis`, `metrics`, `intelligence`, `dashboard`.
- **What must NEVER be placed inside:** Cross-domain logic that belongs in `utils/` or `providers/`.
- **Example future files:** `modules/repository/repository.controller.ts`.

### `utils/`
- **Purpose:** Generic, reusable helper functions.
- **Responsibilities:** Executing pure, stateless functions that do not belong to a specific domain.
- **What belongs inside:** Date formatters, math calculators, string manipulators.
- **What must NEVER be placed inside:** Database calls, stateful operations, or domain-specific business rules.
- **Example future files:** `date.util.ts`, `hash.util.ts`, `logger.util.ts`.

### `types/` & `interfaces/`
- **Purpose:** Type safety definitions.
- **Responsibilities:** Defining the shapes of domain entities, service payloads, and repository returns.
- **What belongs inside:** TypeScript `interface` and `type` declarations.
- **What must NEVER be placed inside:** Executable code or logic.
- **Example future files:** `user.interface.ts`, `express.d.ts`, `ai-report.type.ts`.

### `validators/`
- **Purpose:** Input sanitation and structural validation.
- **Responsibilities:** Ensuring incoming request data matches the required schema before it hits the Controller.
- **What belongs inside:** Zod/Joi schemas, regex validators.
- **What must NEVER be placed inside:** Database checks (e.g., "does user exist" belongs in a Service, not a Validator).
- **Example future files:** `create-repository.validator.ts`, `env.validator.ts`.

### `dto/` (Data Transfer Objects)
- **Purpose:** Defining the contracts for data crossing boundaries.
- **Responsibilities:** Structuring the exact payload expected by a Service or returned by a Controller.
- **What belongs inside:** Classes or types representing payload structures.
- **What must NEVER be placed inside:** Business logic or database logic.
- **Example future files:** `trigger-analysis.dto.ts`, `user-response.dto.ts`.

### `errors/`
- **Purpose:** Standardized exception handling.
- **Responsibilities:** Defining custom error classes that map to specific HTTP statuses or business failures.
- **What belongs inside:** Custom error classes (e.g., `NotFoundError`, `UnauthorizedError`).
- **What must NEVER be placed inside:** Catch blocks or error handling logic (that belongs in Middlewares/Services).
- **Example future files:** `app-error.ts`, `validation-error.ts`, `domain-error.ts`.

### `constants/`
- **Purpose:** Immutable application values.
- **Responsibilities:** Storing magic strings, enums, and globally shared constants.
- **What belongs inside:** Error messages, role enums, default configuration values.
- **What must NEVER be placed inside:** Mutable state or configuration loaded from the environment.
- **Example future files:** `error-messages.constants.ts`, `status-codes.constants.ts`.

### `prisma/`
- **Purpose:** Database lifecycle management.
- **Responsibilities:** Storing migrations, seed data, and the Prisma schema definition.
- **What belongs inside:** `schema.prisma`, seed scripts, migration files.
- **What must NEVER be placed inside:** Repositories or data access execution logic.
- **Example future files:** `schema.prisma`, `seed.ts`, `migrations/`.

### `jobs/`
- **Purpose:** Asynchronous background tasks.
- **Responsibilities:** Executing scheduled tasks or processing background queues without blocking the HTTP event loop.
- **What belongs inside:** Cron job definitions, queue workers.
- **What must NEVER be placed inside:** Direct HTTP request/response handling.
- **Example future files:** `stale-analysis-cleanup.job.ts`, `metrics-aggregation.job.ts`.

### `providers/`
- **Purpose:** External service integration via a Provider Abstraction Layer.
- **Responsibilities:** Abstracting communication with third-party systems. Services must never talk directly to external systems. Instead, they communicate with Provider Interfaces, which are implemented by Provider Implementations.
- **Architecture Flow:** `Service` ↓ `Provider Interface` ↓ `Provider Implementation` ↓ `External Service`
- **What belongs inside:** Provider Interfaces and Provider Implementations.
- **What must NEVER be placed inside:** Internal domain business logic or database interactions.
- **Example Providers:** `GitHub Provider`, `Python Analysis Provider`, `LLM Provider`.
- **Benefits:** This architecture enables provider-agnostic design, meaning swapping one LLM provider for another requires zero changes to the Service layer.

---

## 2. Request Flow Architecture

To maintain a clean separation of concerns, every incoming HTTP request strictly follows this unidirectional flow:

**Client**  
↓  
**Route**  
↓  
**Middleware**  
↓  
**Validator**  
↓  
**Controller**  
↓  
**DTO**  
↓  
**Service**  
↓  
**Repository**  
↓  
**Prisma**  
↓  
**PostgreSQL**  
↓  
**Response**

### Layer Responsibilities
- **Routes:** "I route the traffic."
- **Middlewares:** "I protect the traffic."
- **Validator:** Validates request structure and rejects invalid requests before controller execution.
- **Controllers:** "I translate HTTP into plain functions."
- **DTO:** Transfers validated data and isolates the transport layer from business logic.
- **Services:** "I decide what happens."
- **Repositories:** "I talk to the database."
- **Prisma:** ORM that translates repository operations into SQL.

---

## 3. Architecture Rules

To prevent the Modular Monolith from becoming a Big Ball of Mud, the following invariants are strictly enforced:

1. **Controllers never contain business logic:** They are "thin" and only responsible for parsing HTTP input and returning HTTP output.
2. **Repositories never call external APIs:** They are strictly for interacting with the GitPro PostgreSQL database.
3. **Services never know HTTP:** `req`, `res`, and `next` objects must never be passed into a Service. Services take plain JavaScript/TypeScript objects (DTOs) and return plain objects.
4. **Routes only register endpoints:** They do not contain inline controller logic.
5. **DTOs validate data transfer:** They enforce the contract of data moving between the Controller and the Service.
6. **Validators perform input validation:** They ensure incoming request payloads are structurally sound before execution begins.
7. **Providers integrate external services:** Any communication outside the GitPro Express backend (including the Python Analysis Service) must be encapsulated in a Provider.
8. **Jobs execute background work:** Heavy lifting or cron-based schedules belong here, entirely detached from the Express request lifecycle.

---

## 4. Dependency Rules

Dependencies must flow inward toward the core business logic. Circular dependencies are strictly prohibited.

- `routes/` may depend on `controllers/` and `middlewares/`.
- `middlewares/` may depend on `services/` (e.g., to verify a user session) and `utils/`.
- `controllers/` may depend on `services/`, `dto/`, and `errors/`.
- `services/` may depend on `repositories/`, `providers/`, `jobs/`, and `utils/`.
- `repositories/` may depend on `prisma/` (Prisma Client) and `types/`.
- `providers/` may depend on `utils/` and `types/`.
- `types/`, `constants/`, and `interfaces/` may not depend on any operational folders (they are pure definitions).
- **CRITICAL RESTRICTION:** `services/` must **NEVER** depend on `controllers/` or `routes/`. `repositories/` must **NEVER** depend on `services/`.

---

## 5. Example Request Flow: "Analyze Repository"

When an engineering manager clicks "Analyze Repository" on the dashboard, the following flow triggers:

1. **Client:** The React SPA sends a `POST /api/v1/repositories/123/analyze` request.
2. **Route:** The `repository.routes.ts` file intercepts the POST request and passes it to the `require-auth.middleware.ts`.
3. **Middleware:** The authentication middleware verifies the GitHub session token. If valid, it attaches the User object to the request and forwards it.
4. **Controller:** The `analysis.controller.ts` receives the request, extracts the repository ID `123` from the URL parameters, validates it using a Validator/DTO, and calls `analysisService.triggerAnalysis(repoId, user.id)`.
5. **Service:** The `analysis.service.ts` verifies the user has permissions to analyze this repo (via `user.repository.ts`). It creates a new "Pending" Analysis Run record via `analysis-run.repository.ts`. It then delegates the actual mining task to the `python-analysis.provider.ts`.
6. **Provider:** The Python Provider makes an internal gRPC/REST call to the Dedicated Python Analysis Service to begin the mining process asynchronously.
7. **Repository:** Once the service orchestration is complete, it updates the database state via Repositories.
8. **Controller:** The Service returns a success confirmation object. The Controller formats this into an `HTTP 202 Accepted` response.
9. **Response:** The Client receives the response and shows a loading state while the background job processes.
