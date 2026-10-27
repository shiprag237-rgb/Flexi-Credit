import { Router } from 'express';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notificationController.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';

const router = Router({ mergeParams: true });

router.get('/', requirePermission('notifications:read'), listNotifications);
router.patch('/:notificationId/read', requirePermission('notifications:update'), markNotificationRead);
router.post('/read-all', requirePermission('notifications:update'), markAllNotificationsRead);

export default router;
