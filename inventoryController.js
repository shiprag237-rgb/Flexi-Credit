import { Product } from '../models/Product.js';
import { InventoryMovement } from '../models/InventoryMovement.js';
import { Supplier } from '../models/Supplier.js';
import { recordInventoryMovement } from '../services/inventoryService.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { recordAuditLog } from '../services/auditService.js';

export const getInventoryOverview = async (req, res, next) => {
  try {
    const products = await Product.find({
      businessId: req.business._id,
      trackInventory: true,
      isActive: true,
    })
      .sort({ stockQuantity: 1 })
      .lean();

    const lowStockItems = products.filter((p) => p.stockQuantity <= p.lowStockThreshold);

    // Stock valuation calculation
    const totalValuationMinor = products.reduce((acc, p) => acc + (p.stockQuantity * (p.costMinor || p.priceMinor)), 0);

    return sendSuccess(res, {
      totalItemsTracked: products.length,
      lowStockCount: lowStockItems.length,
      totalValuationMinor,
      currency: req.business.currency,
      products: products.map((p) => ({
        ...p,
        isLowStock: p.stockQuantity <= p.lowStockThreshold,
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const createMovement = async (req, res, next) => {
  try {
    const { productId, type, quantity, reason, reference } = req.body;

    const result = await recordInventoryMovement({
      businessId: req.business._id,
      productId,
      type,
      quantity,
      reason,
      reference,
      userId: req.user._id,
    });

    await recordAuditLog({
      businessId: req.business._id,
      actorUserId: req.user._id,
      action: 'inventory.movement_recorded',
      resourceType: 'inventoryMovement',
      resourceId: result.movement._id,
      metadata: { type, quantity, newStock: result.product.stockQuantity },
      req,
    });

    return sendSuccess(res, result, 'Stock movement recorded successfully.', 201);
  } catch (err) {
    next(err);
  }
};

export const listMovements = async (req, res, next) => {
  try {
    const { productId, limit = 50 } = req.query;
    const filter = { businessId: req.business._id };
    if (productId) filter.productId = productId;

    const movements = await InventoryMovement.find(filter)
      .populate('productId', 'name sku unit')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(Math.min(100, parseInt(limit, 10)))
      .lean();

    return sendSuccess(res, movements);
  } catch (err) {
    next(err);
  }
};

export const listSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({ businessId: req.business._id })
      .populate('productsSupplied', 'name sku')
      .sort({ name: 1 })
      .lean();

    return sendSuccess(res, suppliers);
  } catch (err) {
    next(err);
  }
};

export const createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create({
      ...req.body,
      businessId: req.business._id,
    });
    return sendSuccess(res, supplier, 'Supplier added.', 201);
  } catch (err) {
    next(err);
  }
};
