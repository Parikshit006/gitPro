# Auth Module

## Purpose

The Auth module owns the authentication and authorization boundary for GitPro. It is responsible for managing the GitHub OAuth 2.0 flow, session lifecycle, and identity verification.

## Current Responsibilities

- **Authorization URL generation** — Building a secure, CSRF-protected GitHub OAuth authorization URL using the WHATWG URL API with cryptographically random state values.

## Current Files

| File              | Responsibility                                      |
|-------------------|-----------------------------------------------------|
| `auth.service.ts` | Builds the GitHub authorization URL with CSRF state. |

## Future Roadmap

| Feature                          | Files introduced                                             |
|----------------------------------|--------------------------------------------------------------|
| OAuth Callback Handling          | `auth.controller.ts`, `auth.routes.ts`                       |
| Token Exchange                   | Extension of `auth.service.ts` + GitHub Provider              |
| Session / JWT Management         | Extension of `auth.service.ts`                                |
| Request Validation               | `auth.dto.ts`                                                |
| State Persistence (CSRF)         | Integration with Repository layer                            |
