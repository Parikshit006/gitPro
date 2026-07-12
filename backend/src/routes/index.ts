import { Router, Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import authRoutes from '../modules/auth/auth.routes';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  ApiResponse.success(res, 'GitPro Backend Healthy');
});

router.use('/api/v1/auth', authRoutes);

export default router;
