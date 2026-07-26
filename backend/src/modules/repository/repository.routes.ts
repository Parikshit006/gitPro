/**
 * Repository Routes
 *
 * Purpose:
 *   Route registration for the Repository module. Maps HTTP verbs and
 *   paths to the corresponding controller methods.
 *
 * Why the route contains no logic:
 *   Routes are a declaration layer. They define *what* URL triggers
 *   *which* controller method. They never validate input, construct
 *   responses, or call services directly. This separation ensures that
 *   adding middleware (e.g., authentication, rate limiting) later is a
 *   one-line change without touching business or transport logic.
 */

import { Router } from 'express';
import { repositoryController } from './repository.controller';

const router = Router();

router.post('/', repositoryController.register);
router.post('/:id/sync', repositoryController.sync);
router.get('/:id/health', repositoryController.health);

export default router;
