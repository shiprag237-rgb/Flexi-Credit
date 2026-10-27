import { Router } from 'express';
import {
  listTransactions,
  createTransaction,
  getTransaction,
  deleteTransaction,
  getFinanceSummary,
} from '../controllers/financeController.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { createTransactionSchema } from '../validators/schemas.js';

const router = Router({ mergeParams: true });

router.get('/summary', requirePermission('finance:read'), getFinanceSummary);
router.get('/transactions', requirePermission('finance:read'), listTransactions);
router.post('/transactions', requirePermission('finance:create'), validateBody(createTransactionSchema), createTransaction);
router.get('/transactions/:transactionId', requirePermission('finance:read'), getTransaction);
router.delete('/transactions/:transactionId', requirePermission('finance:delete'), deleteTransaction);

export default router;
