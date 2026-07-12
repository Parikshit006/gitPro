# GitPro Backend

## Purpose
This repository contains the backend service for the GitPro platform, built as a Domain-Oriented Modular Monolith using Express and TypeScript.

## Folder Structure
- `src/config/`: Configuration and environment loading
- `src/controllers/`: Express route handlers
- `src/middlewares/`: Request interceptors
- `src/modules/`: Domain-specific modular code
- `src/providers/`: External service integration
- `src/repositories/`: Data access layer
- `src/routes/`: API endpoint definitions
- `src/services/`: Core business logic
- `prisma/`: Database schemas and migrations
- `tests/`: Unit and integration tests

## How to Run
1. Install dependencies: `npm install`
2. Copy environment file: `cp .env.example .env`
3. Start development server: `npm run dev`

## Available Scripts
- `npm run dev` - Start development server with hot-reload (using nodemon & tsx)
- `npm run build` - Compile TypeScript to JavaScript in `/dist`
- `npm start` - Run the compiled production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Run TypeScript compiler without emitting files

## Architecture Principles
- **Modular Monolith**: Strict logical boundaries separate our domains.
- **Controllers**: Thin wrappers, no business logic.
- **Services**: Pure business logic, no HTTP knowledge.
- **Repositories**: Data access only, no external APIs.
