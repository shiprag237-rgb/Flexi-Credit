import { Router } from 'express';
import {
  listCustomers,
  createCustomer,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { createCustomerSchema, updateCustomerSchema } from '../validators/schemas.js';

const router = Router({ mergeParams: true });

router.get('/', requirePermission('customers:read'), listCustomers);
router.post('/', requirePermission('customers:create'), validateBody(createCustomerSchema), createCustomer);
router.get('/:customerId', requirePermission('customers:read'), getCustomer);
router.patch('/:customerId', requirePermission('customers:update'), validateBody(updateCustomerSchema), updateCustomer);
router.delete('/:customerId', requirePermission('customers:delete'), deleteCustomer);

export default router;
