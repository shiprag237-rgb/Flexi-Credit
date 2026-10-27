import { Router } from 'express';
import {
  createBusiness,
  listUserBusinesses,
  getBusinessDetails,
  updateBusiness,
  getMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
} from '../controllers/businessController.js';
import { getSummary } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireTenant } from '../middleware/tenantMiddleware.js';
import { requireRole, requirePermission } from '../middleware/rbacMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import {
  createBusinessSchema,
  updateBusinessSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from '../validators/schemas.js';
import { ROLES } from '../policies/roleDefinitions.js';

const router = Router();

// User workspaces (global)
router.use(authenticate);
router.get('/', listUserBusinesses);
router.post('/', validateBody(createBusinessSchema), createBusiness);

// Scoped to specific business workspace (:businessId)
router.get('/:businessId', requireTenant, getBusinessDetails);
router.patch(
  '/:businessId',
  requireTenant,
  requireRole(ROLES.OWNER, ROLES.ADMIN),
  validateBody(updateBusinessSchema),
  updateBusiness
);

// Dashboard summary
router.get('/:businessId/dashboard/summary', requireTenant, getSummary);

// Team & Members
router.get('/:businessId/members', requireTenant, requirePermission('team:read'), getMembers);
router.post(
  '/:businessId/invitations',
  requireTenant,
  requireRole(ROLES.OWNER, ROLES.ADMIN),
  validateBody(inviteMemberSchema),
  inviteMember
);
router.patch(
  '/:businessId/members/:memberId',
  requireTenant,
  requireRole(ROLES.OWNER, ROLES.ADMIN),
  validateBody(updateMemberRoleSchema),
  updateMemberRole
);
router.delete(
  '/:businessId/members/:memberId',
  requireTenant,
  requireRole(ROLES.OWNER, ROLES.ADMIN),
  removeMember
);

export default router;
