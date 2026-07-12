# User Module

## Purpose
The User module encapsulates all capabilities and data related to GitPro developers and users. It serves as the foundation for Identity within the Domain-Oriented Modular Monolith architecture.

## Architecture & Collaboration

This module strictly adheres to the GitPro separation of concerns:

- **Routes (`user.routes.ts`)**: Defines the HTTP API surface and applies necessary middlewares (like Auth Guards).
- **Controller (`user.controller.ts`)**: The transport boundary. Extracts HTTP requests and formats HTTP responses using the standardized `ApiResponse`. It delegates all decisions to the Service.
- **Service (`user.service.ts`)**: The business logic core. It has absolutely zero knowledge of Express, making it highly testable. It dictates *what* happens.
- **Repository (`user.repository.ts`)**: The data access boundary. It communicates with PostgreSQL via Prisma, hiding SQL/ORM implementation details from the Service layer.
- **DTOs & Types**: Define the precise shapes of data entering, leaving, and moving internally through the module.

## Future Roadmap
- Implementation of GitHub OAuth flow and token management.
- JWT generation and session mapping.
- Integration with the actual Prisma User model schema.
- Background sync of GitHub profiles and repository access rights.
