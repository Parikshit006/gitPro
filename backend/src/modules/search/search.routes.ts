/**
 * Search Routes
 */

import { Router } from 'express';
import { SearchController } from './search.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new SearchController();

router.use(authenticate);

router.get('/', controller.getSearch);

export default router;
