import { Router } from 'express';
import {
  listInvoices,
  createInvoice,
  getInvoice,
  issueInvoice,
  recordInvoicePayment,
  getInvoicePrintView,
} from '../controllers/invoiceController.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { createInvoiceSchema, recordPaymentSchema } from '../validators/schemas.js';

const router = Router({ mergeParams: true });

router.get('/', requirePermission('invoices:read'), listInvoices);
router.post('/', requirePermission('invoices:create'), validateBody(createInvoiceSchema), createInvoice);
router.get('/:invoiceId', requirePermission('invoices:read'), getInvoice);
router.post('/:invoiceId/issue', requirePermission('invoices:issue'), issueInvoice);
router.post('/:invoiceId/payments', requirePermission('invoices:pay'), validateBody(recordPaymentSchema), recordInvoicePayment);
router.get('/:invoiceId/pdf', requirePermission('invoices:read'), getInvoicePrintView);

export default router;
