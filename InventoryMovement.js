import mongoose from 'mongoose';

export const INVENTORY_MOVEMENT_TYPES = ['stock_in', 'stock_out', 'adjustment', 'return'];

const inventoryMovementSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: INVENTORY_MOVEMENT_TYPES,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
    reference: {
      type: String,
      default: '',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

inventoryMovementSchema.index({ businessId: 1, productId: 1, createdAt: -1 });

export const InventoryMovement = mongoose.model('InventoryMovement', inventoryMovementSchema);
