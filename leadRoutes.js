import { Router } from 'express';
import {
  listLeads,
  createLead,
  getLead,
  updateLead,
  convertLead,
  addLeadActivity,
} from '../controllers/leadController.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { createLeadSchema, updateLeadSchema, convertLeadSchema } from '../validators/schemas.js';

const router = Router({ mergeParams: true });

router.get('/', requirePermission('leads:read'), listLeads);
router.post('/', requirePermission('leads:create'), validateBody(createLeadSchema), createLead);
router.get('/:leadId', requirePermission('leads:read'), getLead);
router.patch('/:leadId', requirePermission('leads:update'), validateBody(updateLeadSchema), updateLead);
router.post('/:leadId/convert', requirePermission('leads:convert'), validateBody(convertLeadSchema), convertLead);
router.post('/:leadId/activities', requirePermission('leads:update'), addLeadActivity);

export default router;
