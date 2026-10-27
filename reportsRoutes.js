import { Router } from 'express';
import {
  getRevenueReport,
  getExpenseReport,
  getProfitReport,
  getLeadConversionReport,
} from '../controllers/reportsController.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';

const router = Router({ mergeParams: true });

router.get('/revenue', requirePermission('reports:read'), getRevenueReport);
router.get('/expenses', requirePermission('reports:read'), getExpenseReport);
router.get('/profit', requirePermission('reports:read'), getProfitReport);
router.get('/leads', requirePermission('reports:read'), getLeadConversionReport);

export default router;
