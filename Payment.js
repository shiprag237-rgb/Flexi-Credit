import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    amountMinor: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    method: {
      type: String,
      enum: ['bank_transfer', 'credit_card', 'cash', 'upi', 'check', 'other'],
      default: 'bank_transfer',
    },
    reference: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed', 'refunded'],
      default: 'completed',
    },
    notes: {
      type: String,
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ businessId: 1, invoiceId: 1 });
paymentSchema.index({ businessId: 1, paymentDate: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
