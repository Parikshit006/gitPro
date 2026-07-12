/**
 * Auth Routes
 *
 * Purpose:
 *   Route registration for the Auth module. Maps HTTP verbs and paths
 *   to the corresponding controller methods.
 *
 * Why the route contains no logic:
 *   Routes are a declaration layer. They define *what* URL triggers
 *   *which* controller method. They never validate input, construct
 *   responses, or call services directly. This separation ensures that
 *   adding middleware (e.g., rate limiting) later is a one-line change
 *   without touching business or transport logic.
 */

import { Router } from 'express';
import { authController } from './auth.controller';

const router = Router();

router.get('/github', authController.initiateGitHubOAuth);
router.get('/github/callback', authController.githubCallback);

export default router;
