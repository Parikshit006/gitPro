/**
 * Repository Routes
 *
 * Purpose:
 *   Route registration for the Repository module. All endpoints require authentication.
 *
 * Endpoints:
 *   GET  /api/v1/repositories          — List all registered repositories
 *   POST /api/v1/repositories          — Register a new repository by clone URL
 *   GET  /api/v1/repositories/:id      — Get a single repository by ID
 *   POST /api/v1/repositories/:id/sync — Trigger clone / re-sync
 *   GET  /api/v1/repositories/:id/health — File system health check
 */

import { Router } from 'express';
import { repositoryController } from './repository.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Apply authentication to all repository endpoints
router.use(authenticate);

// List all repositories (used by useRepositories hook and AppLayout sidebar)
router.get('/', repositoryController.list);

// Register a new repository by clone URL
router.post('/', repositoryController.register);

// Get a single repository by ID (used by useRepository hook with polling)
router.get('/:id', repositoryController.getById);

// Trigger repository clone or re-sync
router.post('/:id/sync', repositoryController.sync);

// File system health check for a repository
router.get('/:id/health', repositoryController.health);

export default router;
