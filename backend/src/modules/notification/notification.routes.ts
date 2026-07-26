/**
 * Notification Routes (HTTP Route Declaration & Middleware Composition Layer)
 *
 * Purpose:
 *   Registers HTTP endpoints for the Notification module, applying authentication middleware
 *   and mapping POST requests to NotificationController handlers.
 *
 * Strict Architectural Rules:
 *   - Zero business logic, zero formatting, zero delivery implementation.
 *   - Applies JWT authentication middleware to protect notification endpoints.
 */

import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new NotificationController();

// Apply authentication middleware to all notification endpoints
router.use(authenticate);

// POST /notifications/email
router.post('/email', controller.sendEmail);

// POST /notifications/slack
router.post('/slack', controller.sendSlack);

// POST /notifications/webhook
router.post('/webhook', controller.sendWebhook);

export default router;
