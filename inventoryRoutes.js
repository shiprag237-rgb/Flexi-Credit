import { Router } from 'express';
import {
  getInventoryOverview,
  createMovement,
  listMovements,
  listSuppliers,
  createSupplier,
} from '../controllers/inventoryController.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { createMovementSchema, createSupplierSchema } from '../validators/schemas.js';

const router = Router({ mergeParams: true });

router.get('/', requirePermission('inventory:read'), getInventoryOverview);
router.post('/movements', requirePermission('inventory:move'), validateBody(createMovementSchema), createMovement);
router.get('/movements', requirePermission('inventory:read'), listMovements);
router.get('/suppliers', requirePermission('inventory:read'), listSuppliers);
router.post('/suppliers', requirePermission('inventory:update'), validateBody(createSupplierSchema), createSupplier);

export default router;
