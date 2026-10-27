import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product or service name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['product', 'service'],
      default: 'product',
      index: true,
    },
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    priceMinor: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    costMinor: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    unit: {
      type: String,
      default: 'unit',
      trim: true,
    },
    stockQuantity: {
      type: Number,
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
    },
    trackInventory: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

productSchema.index({ businessId: 1, sku: 1 });
productSchema.index({ businessId: 1, name: 1 });
productSchema.index({ businessId: 1, category: 1 });

export const Product = mongoose.model('Product', productSchema);
