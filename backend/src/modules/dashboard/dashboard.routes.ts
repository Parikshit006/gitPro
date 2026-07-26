/**
 * Dashboard Routes (HTTP Route Declaration & Middleware Composition Layer)
 *
 * Purpose:
 *   Route registration for the Dashboard module.
 *   Composes authentication middleware, placeholder validation middleware,
 *   and maps HTTP verbs and URL paths to DashboardController handlers.
 *
 * Strict Architectural Rules:
 *   - Zero business logic, zero Prisma, zero DTO mapping, zero orchestration.
 *   - Must apply JWT authentication middleware to protect every endpoint.
 *   - Unauthenticated users must never reach DashboardController.
 *   - Leaves placeholder comments for future Zod, pagination, and query validation.
 */

import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new DashboardController();

// GET /api/v1/dashboard -> Executive Organizational Overview
router.get(
  '/',
  authenticate,
  /* TODO: [Placeholder] Add Zod / Query parameter validation middleware here */
  controller.getDashboardOverview,
);

// GET /api/v1/dashboard/repositories -> Paginated Summarized Repository Cards
router.get(
  '/repositories',
  authenticate,
  /* TODO: [Placeholder] Add Pagination query parameter validation middleware here */
  controller.getRepositories,
);

// GET /api/v1/dashboard/repositories/:id -> Consolidated Workspace Deep-Dive Report
router.get(
  '/repositories/:id',
  authenticate,
  /* TODO: [Placeholder] Add Zod / Route parameter (:id) validation middleware here */
  controller.getRepositoryOverview,
);

// GET /api/v1/dashboard/repositories/:id/overview -> Alias for Consolidated Workspace Deep-Dive
router.get(
  '/repositories/:id/overview',
  authenticate,
  /* TODO: [Placeholder] Add Zod / Route parameter (:id) validation middleware here */
  controller.getRepositoryOverview,
);

// GET /api/v1/dashboard/repositories/:id/health -> Synthesizes RepositoryHealth Scorecard
router.get(
  '/repositories/:id/health',
  authenticate,
  /* TODO: [Placeholder] Add Zod / Route parameter (:id) validation middleware here */
  controller.getRepositoryHealth,
);

// GET /api/v1/dashboard/repositories/:id/activity -> Temporal Contribution Trends & Throughput
router.get(
  '/repositories/:id/activity',
  authenticate,
  /* TODO: [Placeholder] Add Zod / Route parameter (:id) validation middleware here */
  controller.getRepositoryActivity,
);

// GET /api/v1/dashboard/repositories/:id/hotspots -> Ranked HotspotSummary DTOs
router.get(
  '/repositories/:id/hotspots',
  authenticate,
  /* TODO: [Placeholder] Add Zod / Route parameter (:id) validation middleware here */
  controller.getRepositoryHotspots,
);

// GET /api/v1/dashboard/repositories/:id/ownership -> File-Level Maintainer Attribution
router.get(
  '/repositories/:id/ownership',
  authenticate,
  /* TODO: [Placeholder] Add Zod / Route parameter (:id) validation middleware here */
  controller.getRepositoryOwnership,
);

// GET /api/v1/dashboard/repositories/:id/bus-factor -> Maintainer Concentration Risk Summary
router.get(
  '/repositories/:id/bus-factor',
  authenticate,
  /* TODO: [Placeholder] Add Zod / Route parameter (:id) validation middleware here */
  controller.getRepositoryBusFactor,
);

export default router;
