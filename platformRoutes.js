import { Router } from 'express';
import {
  getPlatformStats,
  listAllBusinesses,
  updateBusinessStatus,
  getPlatformAuditLogs,
} from '../controllers/platformController.js';
import { authenticate, requirePlatformAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate, requirePlatformAdmin);

router.get('/stats', getPlatformStats);
router.get('/businesses', listAllBusinesses);
router.patch('/businesses/:businessId/status', updateBusinessStatus);
router.get('/audit-logs', getPlatformAuditLogs);

export default router;
