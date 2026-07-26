/**
 * Report Routes (HTTP Route Declaration & Middleware Composition Layer)
 *
 * Purpose:
 *   Registers HTTP endpoints for the Report module, applying authentication middleware
 *   and directing requests to ReportController handlers.
 *
 * Strict Architectural Rules:
 *   - Zero business logic, zero data retrieval, zero formatting.
 *   - Applies JWT authentication middleware to protect reporting endpoints.
 */

import { Router } from 'express';
import { ReportController } from './report.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new ReportController();

// Apply authentication middleware to all reporting endpoints
router.use(authenticate);

// GET /reports/executive
router.get('/executive', controller.getExecutiveReport);

// GET /reports/repository/:id
router.get('/repository/:id', controller.getRepositoryReport);

// GET /reports/developer/:id
router.get('/developer/:id', controller.getDeveloperReport);

// GET /reports/organization
router.get('/organization', controller.getOrganizationReport);

// GET /reports/weekly
router.get('/weekly', controller.getWeeklyReport);

// GET /reports/monthly
router.get('/monthly', controller.getMonthlyReport);

export default router;
