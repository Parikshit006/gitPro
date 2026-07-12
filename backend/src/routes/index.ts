import { Router, Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  ApiResponse.success(res, 'GitPro Backend Healthy');
});

export default router;
