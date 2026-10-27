import mongoose from 'mongoose';

export const INVOICE_STATUSES = ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'];

const lineItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    unitPriceMinor: {
      type: Number,
      required: true,
      min: 0,
    },
    discountMinor: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    taxAmountMinor: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalMinor: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: INVOICE_STATUSES,
      default: 'draft',
      index: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    lineItems: [lineItemSchema],
    subtotalMinor: {
      type: Number,
      required: true,
      default: 0,
    },
    discountMinor: {
      type: Number,
      default: 0,
    },
    taxMinor: {
      type: Number,
      default: 0,
    },
    totalMinor: {
      type: Number,
      required: true,
      default: 0,
    },
    paidMinor: {
      type: Number,
      default: 0,
    },
    balanceMinor: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentTerms: {
      type: String,
      default: 'Due on receipt',
    },
    notes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Business-scoped unique invoice number
invoiceSchema.index({ businessId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ businessId: 1, status: 1 });
invoiceSchema.index({ businessId: 1, customerId: 1 });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
