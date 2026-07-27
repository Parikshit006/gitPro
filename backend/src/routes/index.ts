import { Router, Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import authRoutes from '../modules/auth/auth.routes';
import repositoryRoutes from '../modules/repository/repository.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import reportRoutes from '../modules/report/report.routes';
import notificationRoutes from '../modules/notification/notification.routes';
import searchRoutes from '../modules/search/search.routes';
import aiRoutes from '../modules/ai/ai.routes';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  ApiResponse.success(res, 'GitPro Backend Healthy');
});

router.use('/api/v1/auth', authRoutes);
router.use('/api/v1/repositories', repositoryRoutes);
router.use('/api/v1/dashboard', dashboardRoutes);
router.use('/api/v1/search', searchRoutes);
router.use('/api/v1/ai', aiRoutes);

// Register Reports and Notifications under both versioned and root endpoints for flexibility
router.use('/api/v1/reports', reportRoutes);
router.use('/reports', reportRoutes);
router.use('/api/v1/notifications', notificationRoutes);
router.use('/notifications', notificationRoutes);

export default router;

