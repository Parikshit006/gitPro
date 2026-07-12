# Auth Module

## Purpose

The Auth module owns the authentication and authorization boundary for GitPro. It is responsible for managing the GitHub OAuth 2.0 flow, session lifecycle, and identity verification.

## Current Responsibilities

- **Authorization URL generation** — Building a secure GitHub OAuth authorization URL using the WHATWG URL API.
- **OAuth initiation endpoint** — Exposing `GET /api/v1/auth/github` to redirect the browser to GitHub's consent screen.
- **State management** — Generating, validating, expiring, and deleting CSRF state tokens for the OAuth flow.

## Current Files

| File                  | Responsibility                                                        |
|-----------------------|-----------------------------------------------------------------------|
| `auth.service.ts`     | Builds the GitHub authorization URL with CSRF state.                  |
| `auth.controller.ts`  | HTTP transport layer — orchestrates redirect via AuthService.         |
| `auth.routes.ts`      | Route registration — maps `GET /github` to the controller.            |
| `state.service.ts`    | OAuth state lifecycle — create, validate, expire, delete.             |

## Future Roadmap

| Feature                          | Files introduced                                              |
|----------------------------------|---------------------------------------------------------------|
| OAuth Callback Handling          | Extension of `auth.controller.ts`, `auth.routes.ts`           |
| Token Exchange                   | GitHub Provider                                               |
| Session / JWT Management         | Extension of `auth.service.ts`                                |
| Request Validation               | `auth.dto.ts`                                                 |
| Redis State Storage              | Swap internal Map in `state.service.ts` (no caller changes)   |
