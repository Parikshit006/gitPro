# Auth Module

## Purpose

The Auth module owns the authentication and authorization boundary for GitPro. It is responsible for managing the GitHub OAuth 2.0 flow, session lifecycle, and identity verification.

## Current Responsibilities

- **Authorization URL generation** — Building a secure GitHub OAuth authorization URL using the WHATWG URL API.
- **OAuth initiation endpoint** — Exposing `GET /api/v1/auth/github` to redirect the browser to GitHub's consent screen.
- **State management** — Generating, validating, expiring, and deleting CSRF state tokens for the OAuth flow.
- **Authorization code exchange** — Exchanging OAuth authorization codes for GitHub access tokens via server-to-server HTTP.
- **GitHub user profile retrieval** — Fetching the authenticated user's identity from GitHub and mapping it into GitPro's internal domain model.
- **Authentication Orchestration** — Coordinating state validation, token exchange, profile retrieval, and database upserts.
- **JWT Management** — Secure, stateless session token generation and verification using HS256 signatures.

## Current Files

| File                  | Responsibility                                                        |
|-----------------------|-----------------------------------------------------------------------|
| `auth.service.ts`     | Application service orchestrating the full GitHub OAuth flow.         |
| `auth.controller.ts`  | HTTP transport layer — orchestrates redirect via AuthService.         |
| `auth.routes.ts`      | Route registration — maps `GET /github` to the controller.            |
| `state.service.ts`    | OAuth state lifecycle — create, validate, expire, delete.             |
| `github.provider.ts`  | Token exchange and authenticated user profile retrieval via GitHub API.|
| `jwt.service.ts`      | Generates and verifies JWTs for stateless session management.         |

## Future Roadmap

| Feature                          | Files introduced                                              |
|----------------------------------|---------------------------------------------------------------|
| OAuth Callback Handling          | Extension of `auth.controller.ts`, `auth.routes.ts`           |
| Request Validation               | `auth.dto.ts`                                                 |
| Redis State Storage              | Swap internal Map in `state.service.ts` (no caller changes)   |
