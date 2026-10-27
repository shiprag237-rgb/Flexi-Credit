import { Product } from '../models/Product.js';
import { InventoryMovement } from '../models/InventoryMovement.js';

export const recordInventoryMovement = async ({
  businessId,
  productId,
  type,
  quantity,
  reason,
  reference,
  userId,
}) => {
  const product = await Product.findOne({ _id: productId, businessId });
  if (!product) throw new Error('Product not found');

  if (!product.trackInventory) {
    throw new Error('Inventory tracking is not enabled for this product/service.');
  }

  const previousStock = product.stockQuantity || 0;
  let newStock = previousStock;

  switch (type) {
    case 'stock_in':
    case 'return':
      newStock = previousStock + quantity;
      break;
    case 'stock_out':
      if (previousStock < quantity) {
        throw new Error(`Insufficient stock. Current stock is ${previousStock}, requested out is ${quantity}.`);
      }
      newStock = previousStock - quantity;
      break;
    case 'adjustment':
      // For adjustment, quantity represents the delta or set amount
      newStock = quantity;
      break;
    default:
      throw new Error(`Unsupported movement type: ${type}`);
  }

  product.stockQuantity = newStock;
  await product.save();

  const movement = await InventoryMovement.create({
    businessId,
    productId: product._id,
    type,
    quantity,
    previousStock,
    newStock,
    reason: reason || '',
    reference: reference || '',
    performedBy: userId,
  });

  return { movement, product };
};
