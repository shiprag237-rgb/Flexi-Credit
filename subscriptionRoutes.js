import { Router } from 'express';
import {
  getSubscription,
  listPlans,
  checkoutSandboxPlan,
  cancelSubscription,
} from '../controllers/subscriptionController.js';
import { requireRole } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../policies/roleDefinitions.js';

const router = Router({ mergeParams: true });

router.get('/', getSubscription);
router.get('/plans', listPlans);
router.post('/checkout', requireRole(ROLES.OWNER), checkoutSandboxPlan);
router.post('/cancel', requireRole(ROLES.OWNER), cancelSubscription);

export default router;
