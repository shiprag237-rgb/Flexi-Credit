import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    billingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    shippingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    customerType: {
      type: String,
      enum: ['individual', 'business'],
      default: 'business',
    },
    status: {
      type: String,
      enum: ['active', 'lead', 'inactive', 'archived'],
      default: 'active',
      index: true,
    },
    source: {
      type: String,
      default: 'direct',
    },
    tags: {
      type: [String],
      default: [],
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

customerSchema.index({ businessId: 1, name: 1 });
customerSchema.index({ businessId: 1, email: 1 });
customerSchema.index({ businessId: 1, status: 1 });

export const Customer = mongoose.model('Customer', customerSchema);
