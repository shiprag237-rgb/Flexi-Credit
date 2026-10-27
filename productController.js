import { Product } from '../models/Product.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { recordAuditLog } from '../services/auditService.js';

export const listProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      type,
      category,
      search = '',
      sortBy = 'name',
      order = 'asc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { businessId: req.business._id };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(filter),
    ]);

    return sendSuccess(res, products, null, 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    // Check SKU uniqueness within this business if SKU provided
    if (req.body.sku) {
      const existing = await Product.findOne({
        businessId: req.business._id,
        sku: req.body.sku.trim(),
      });
      if (existing) {
        return sendError(res, 'A product with this SKU already exists in this workspace.', 409, 'DUPLICATE_SKU');
      }
    }

    const product = await Product.create({
      ...req.body,
      businessId: req.business._id,
      createdBy: req.user._id,
    });

    await recordAuditLog({
      businessId: req.business._id,
      actorUserId: req.user._id,
      action: 'product.created',
      resourceType: 'product',
      resourceId: product._id,
      metadata: { name: product.name, sku: product.sku },
      req,
    });

    return sendSuccess(res, product, 'Product created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await Product.findOne({ _id: productId, businessId: req.business._id });
    if (!product) {
      return sendError(res, 'Product not found.', 404, 'NOT_FOUND');
    }
    return sendSuccess(res, product);
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await Product.findOneAndUpdate(
      { _id: productId, businessId: req.business._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!product) {
      return sendError(res, 'Product not found.', 404, 'NOT_FOUND');
    }
    return sendSuccess(res, product, 'Product updated successfully.');
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await Product.findOneAndDelete({
      _id: productId,
      businessId: req.business._id,
    });
    if (!product) {
      return sendError(res, 'Product not found.', 404, 'NOT_FOUND');
    }
    return sendSuccess(res, null, 'Product deleted successfully.');
  } catch (err) {
    next(err);
  }
};
