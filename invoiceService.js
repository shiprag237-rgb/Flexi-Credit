import { Invoice } from '../models/Invoice.js';
import { Business } from '../models/Business.js';
import { Payment } from '../models/Payment.js';
import { Transaction } from '../models/Transaction.js';

/**
 * Calculates line items and totals strictly on the server
 */
export const calculateInvoiceTotals = (lineItems = [], currency = 'USD') => {
  let subtotalMinor = 0;
  let totalDiscountMinor = 0;
  let totalTaxMinor = 0;

  const calculatedItems = lineItems.map((item) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Math.max(0, Math.round(Number(item.unitPriceMinor) || 0));
    const discount = Math.max(0, Math.round(Number(item.discountMinor) || 0));
    const taxRate = Math.min(100, Math.max(0, Number(item.taxRate) || 0));

    const itemBaseTotal = Math.max(0, (qty * unitPrice) - discount);
    const itemTax = Math.round((itemBaseTotal * taxRate) / 100);
    const itemTotal = itemBaseTotal + itemTax;

    subtotalMinor += (qty * unitPrice);
    totalDiscountMinor += discount;
    totalTaxMinor += itemTax;

    return {
      productId: item.productId || null,
      description: item.description,
      quantity: qty,
      unitPriceMinor: unitPrice,
      discountMinor: discount,
      taxRate,
      taxAmountMinor: itemTax,
      totalMinor: itemTotal,
    };
  });

  const totalMinor = Math.max(0, subtotalMinor - totalDiscountMinor + totalTaxMinor);

  return {
    lineItems: calculatedItems,
    subtotalMinor,
    discountMinor: totalDiscountMinor,
    taxMinor: totalTaxMinor,
    totalMinor,
  };
};

/**
 * Generates the next sequential invoice number for a given business workspace
 */
export const getNextInvoiceNumber = async (businessId) => {
  const business = await Business.findById(businessId);
  if (!business) throw new Error('Business not found');

  const prefix = business.settings?.invoicePrefix || 'INV-';
  const nextNum = business.settings?.nextInvoiceNumber || 1001;

  // Increment counter in settings atomically
  await Business.findByIdAndUpdate(businessId, {
    $inc: { 'settings.nextInvoiceNumber': 1 },
  });

  return `${prefix}${nextNum}`;
};

/**
 * Applies a payment against an invoice and records corresponding transaction
 */
export const applyPaymentToInvoice = async ({
  businessId,
  invoiceId,
  amountMinor,
  method,
  reference,
  notes,
  userId,
  paymentDate,
}) => {
  const invoice = await Invoice.findOne({ _id: invoiceId, businessId });
  if (!invoice) throw new Error('Invoice not found');

  if (invoice.status === 'paid') {
    throw new Error('This invoice is already fully paid.');
  }
  if (invoice.status === 'cancelled') {
    throw new Error('Cannot apply payments to a cancelled invoice.');
  }

  if (amountMinor > invoice.balanceMinor) {
    throw new Error(`Payment amount (${amountMinor}) exceeds remaining balance (${invoice.balanceMinor}).`);
  }

  // Create Payment record
  const payment = await Payment.create({
    businessId,
    invoiceId: invoice._id,
    amountMinor,
    currency: invoice.currency,
    paymentDate: paymentDate || new Date(),
    method: method || 'bank_transfer',
    reference: reference || '',
    notes: notes || '',
    recordedBy: userId,
    status: 'completed',
  });

  // Update Invoice paidMinor & balanceMinor & status
  invoice.paidMinor += amountMinor;
  invoice.balanceMinor = Math.max(0, invoice.totalMinor - invoice.paidMinor);

  if (invoice.balanceMinor === 0) {
    invoice.status = 'paid';
  } else {
    invoice.status = 'partially_paid';
  }
  await invoice.save();

  // Create corresponding Income Transaction in ledger
  await Transaction.create({
    businessId,
    type: 'income',
    category: 'sales',
    amountMinor,
    currency: invoice.currency,
    transactionDate: payment.paymentDate,
    paymentMethod: method || 'bank_transfer',
    customerId: invoice.customerId,
    invoiceId: invoice._id,
    description: `Payment for Invoice ${invoice.invoiceNumber}`,
    reference: reference || `PAY-${payment._id.toString().slice(-6).toUpperCase()}`,
    createdBy: userId,
  });

  return { payment, invoice };
};
