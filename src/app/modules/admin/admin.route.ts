import { Router } from 'express';
import { DashboardController } from './admin.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
import { AdminValidation } from './admin.validation';

const router = Router();

// Get dashboard statistics
router.get(
  '/stats',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(AdminValidation.getDashboardStatsSchema),
  DashboardController.getDashboardStats
);

router.get(
  '/revenue/monthly',
  auth(USER_ROLES.SUPER_ADMIN),
  DashboardController.getMonthlyRevenue
);

export const DashboardRoutes = router;
