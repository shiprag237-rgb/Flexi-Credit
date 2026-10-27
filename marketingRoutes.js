import { Router } from 'express';
import {
  listCampaigns,
  createCampaign,
  getCampaign,
  updateCampaign,
  deleteCampaign,
} from '../controllers/marketingController.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { createCampaignSchema, updateCampaignSchema } from '../validators/schemas.js';

const router = Router({ mergeParams: true });

router.get('/', requirePermission('marketing:read'), listCampaigns);
router.post('/', requirePermission('marketing:create'), validateBody(createCampaignSchema), createCampaign);
router.get('/:campaignId', requirePermission('marketing:read'), getCampaign);
router.patch('/:campaignId', requirePermission('marketing:update'), validateBody(updateCampaignSchema), updateCampaign);
router.delete('/:campaignId', requirePermission('marketing:delete'), deleteCampaign);

export default router;
