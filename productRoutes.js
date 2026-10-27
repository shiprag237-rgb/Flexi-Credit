import { Router } from 'express';
import {
  listProducts,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { createProductSchema, updateProductSchema } from '../validators/schemas.js';

const router = Router({ mergeParams: true });

router.get('/', requirePermission('products:read'), listProducts);
router.post('/', requirePermission('products:create'), validateBody(createProductSchema), createProduct);
router.get('/:productId', requirePermission('products:read'), getProduct);
router.patch('/:productId', requirePermission('products:update'), validateBody(updateProductSchema), updateProduct);
router.delete('/:productId', requirePermission('products:delete'), deleteProduct);

export default router;
