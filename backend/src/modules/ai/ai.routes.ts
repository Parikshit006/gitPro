/**
 * AI Routes
 */

import { Router } from 'express';
import { AIController } from './ai.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new AIController();

router.use(authenticate);

router.post('/chat', controller.postChat);
router.post('/explain', controller.postExplain);
router.get('/status', controller.getStatus);

export default router;
