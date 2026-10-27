import mongoose from 'mongoose';

export const TRANSACTION_TYPES = ['income', 'expense'];
export const TRANSACTION_CATEGORIES = [
  'sales',
  'services',
  'consulting',
  'salaries',
  'rent',
  'utilities',
  'marketing',
  'software',
  'supplies',
  'travel',
  'equipment',
  'taxes',
  'other'
];

const transactionSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: TRANSACTION_TYPES,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: TRANSACTION_CATEGORIES,
      required: true,
      index: true,
    },
    amountMinor: {
      type: Number,
      required: [true, 'Amount in minor units is required'],
      min: [1, 'Amount must be at least 1 minor unit'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'credit_card', 'cash', 'upi', 'check', 'other'],
      default: 'bank_transfer',
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    reference: {
      type: String,
      trim: true,
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

transactionSchema.index({ businessId: 1, type: 1, transactionDate: -1 });
transactionSchema.index({ businessId: 1, category: 1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
