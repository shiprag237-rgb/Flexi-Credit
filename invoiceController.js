import { Invoice } from '../models/Invoice.js';
import { Customer } from '../models/Customer.js';
import { Payment } from '../models/Payment.js';
import { calculateInvoiceTotals, getNextInvoiceNumber, applyPaymentToInvoice } from '../services/invoiceService.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { recordAuditLog } from '../services/auditService.js';

export const listInvoices = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 25,
      status,
      customerId,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { businessId: req.business._id };
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (search) {
      filter.invoiceNumber = { $regex: search, $options: 'i' };
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('customerId', 'name companyName email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Invoice.countDocuments(filter),
    ]);

    return sendSuccess(res, invoices, null, 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

export const createInvoice = async (req, res, next) => {
  try {
    const { customerId, dueDate, issueDate, paymentTerms, notes, lineItems } = req.body;

    const customer = await Customer.findOne({ _id: customerId, businessId: req.business._id });
    if (!customer) {
      return sendError(res, 'Customer not found.', 404, 'NOT_FOUND');
    }

    // Server-side calculation of line items and totals
    const calculations = calculateInvoiceTotals(lineItems, req.business.currency);
    const invoiceNumber = await getNextInvoiceNumber(req.business._id);

    const invoice = await Invoice.create({
      businessId: req.business._id,
      invoiceNumber,
      customerId: customer._id,
      status: 'draft',
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      dueDate: new Date(dueDate),
      currency: req.business.currency,
      lineItems: calculations.lineItems,
      subtotalMinor: calculations.subtotalMinor,
      discountMinor: calculations.discountMinor,
      taxMinor: calculations.taxMinor,
      totalMinor: calculations.totalMinor,
      paidMinor: 0,
      balanceMinor: calculations.totalMinor,
      paymentTerms: paymentTerms || 'Due on receipt',
      notes: notes || '',
      createdBy: req.user._id,
    });

    await recordAuditLog({
      businessId: req.business._id,
      actorUserId: req.user._id,
      action: 'invoice.draft_created',
      resourceType: 'invoice',
      resourceId: invoice._id,
      metadata: { invoiceNumber: invoice.invoiceNumber, totalMinor: invoice.totalMinor },
      req,
    });

    const populated = await Invoice.findById(invoice._id).populate('customerId', 'name companyName email');
    return sendSuccess(res, populated, 'Invoice draft created.', 201);
  } catch (err) {
    next(err);
  }
};

export const getInvoice = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Invoice.findOne({ _id: invoiceId, businessId: req.business._id })
      .populate('customerId')
      .populate('lineItems.productId', 'name sku unit');

    if (!invoice) {
      return sendError(res, 'Invoice not found.', 404, 'NOT_FOUND');
    }

    const payments = await Payment.find({ businessId: req.business._id, invoiceId })
      .sort({ paymentDate: -1 });

    return sendSuccess(res, {
      ...invoice.toObject(),
      payments,
      businessDetails: {
        name: req.business.name,
        currency: req.business.currency,
        logoUrl: req.business.logoUrl,
        settings: req.business.settings,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const issueInvoice = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Invoice.findOne({ _id: invoiceId, businessId: req.business._id });
    if (!invoice) {
      return sendError(res, 'Invoice not found.', 404, 'NOT_FOUND');
    }

    if (invoice.status !== 'draft') {
      return sendError(res, `Invoice is already in "${invoice.status}" status.`, 400, 'BAD_REQUEST');
    }

    invoice.status = 'sent';
    await invoice.save();

    await recordAuditLog({
      businessId: req.business._id,
      actorUserId: req.user._id,
      action: 'invoice.issued',
      resourceType: 'invoice',
      resourceId: invoice._id,
      metadata: { invoiceNumber: invoice.invoiceNumber },
      req,
    });

    return sendSuccess(res, invoice, 'Invoice issued and marked as Sent.');
  } catch (err) {
    next(err);
  }
};

export const recordInvoicePayment = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    const { amountMinor, paymentDate, method, reference, notes } = req.body;

    const result = await applyPaymentToInvoice({
      businessId: req.business._id,
      invoiceId,
      amountMinor,
      method,
      reference,
      notes,
      userId: req.user._id,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    });

    await recordAuditLog({
      businessId: req.business._id,
      actorUserId: req.user._id,
      action: 'invoice.payment_recorded',
      resourceType: 'payment',
      resourceId: result.payment._id,
      metadata: { invoiceNumber: result.invoice.invoiceNumber, amountMinor },
      req,
    });

    return sendSuccess(res, result, 'Payment recorded successfully.');
  } catch (err) {
    next(err);
  }
};

export const getInvoicePrintView = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await Invoice.findOne({ _id: invoiceId, businessId: req.business._id }).populate('customerId');

    if (!invoice) {
      return sendError(res, 'Invoice not found.', 404, 'NOT_FOUND');
    }

    const payments = await Payment.find({ businessId: req.business._id, invoiceId }).sort({ paymentDate: -1 });

    return sendSuccess(res, {
      invoice,
      payments,
      business: req.business,
    });
  } catch (err) {
    next(err);
  }
};
