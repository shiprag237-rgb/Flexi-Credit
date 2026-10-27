import mongoose from 'mongoose';

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [120, 'Business name cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Workspace slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    industry: {
      type: String,
      enum: ['technology', 'retail', 'services', 'consulting', 'healthcare', 'manufacturing', 'agency', 'wholesale', 'other'],
      default: 'services',
    },
    businessSize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201+'],
      default: '1-10',
    },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
      maxlength: 3,
    },
    locale: {
      type: String,
      default: 'en-US',
    },
    settings: {
      invoicePrefix: { type: String, default: 'INV-' },
      nextInvoiceNumber: { type: Number, default: 1001 },
      defaultPaymentTerms: { type: String, default: 'Due on receipt' },
      taxRatePercentage: { type: Number, default: 0 },
      inventoryEnabled: { type: Boolean, default: true },
      marketingEnabled: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'archived'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

export const Business = mongoose.model('Business', businessSchema);
