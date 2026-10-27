import { Customer } from '../models/Customer.js';
import { Invoice } from '../models/Invoice.js';
import { Project } from '../models/Project.js';
import { Transaction } from '../models/Transaction.js';
import { Subscription } from '../models/Subscription.js';
import { SUBSCRIPTION_PLANS } from '../config/plans.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { recordAuditLog } from '../services/auditService.js';

export const listCustomers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status,
      customerType,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { businessId: req.business._id };

    if (status) filter.status = status;
    if (customerType) filter.customerType = customerType;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const [customers, total] = await Promise.all([
      Customer.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
      Customer.countDocuments(filter),
    ]);

    return sendSuccess(res, customers, null, 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    // Check subscription plan limits
    const subscription = await Subscription.findOne({ businessId: req.business._id });
    const plan = SUBSCRIPTION_PLANS[subscription?.planId || 'free'];
    const currentCustomerCount = await Customer.countDocuments({ businessId: req.business._id });

    if (currentCustomerCount >= plan.limits.maxCustomers) {
      return sendError(
        res,
        `Your current plan (${plan.name}) allows up to ${plan.limits.maxCustomers} customers. Please upgrade your plan.`,
        403,
        'LIMIT_REACHED'
      );
    }

    // Optional email duplicate check within this business
    if (req.body.email) {
      const existing = await Customer.findOne({
        businessId: req.business._id,
        email: req.body.email.toLowerCase(),
      });
      if (existing) {
        return sendError(res, 'A customer with this email address already exists in this workspace.', 409, 'DUPLICATE_EMAIL');
      }
    }

    const customer = await Customer.create({
      ...req.body,
      businessId: req.business._id,
      createdBy: req.user._id,
    });

    await recordAuditLog({
      businessId: req.business._id,
      actorUserId: req.user._id,
      action: 'customer.created',
      resourceType: 'customer',
      resourceId: customer._id,
      metadata: { name: customer.name, email: customer.email },
      req,
    });

    return sendSuccess(res, customer, 'Customer created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

export const getCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findOne({ _id: customerId, businessId: req.business._id });
    if (!customer) {
      return sendError(res, 'Customer not found.', 404, 'NOT_FOUND');
    }

    // Related entities for customer detail page
    const [invoices, projects, transactions] = await Promise.all([
      Invoice.find({ businessId: req.business._id, customerId }).sort({ issueDate: -1 }).limit(10),
      Project.find({ businessId: req.business._id, customerId }).sort({ createdAt: -1 }),
      Transaction.find({ businessId: req.business._id, customerId }).sort({ transactionDate: -1 }).limit(10),
    ]);

    return sendSuccess(res, {
      ...customer.toObject(),
      invoices,
      projects,
      transactions,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findOneAndUpdate(
      { _id: customerId, businessId: req.business._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return sendError(res, 'Customer not found.', 404, 'NOT_FOUND');
    }

    await recordAuditLog({
      businessId: req.business._id,
      actorUserId: req.user._id,
      action: 'customer.updated',
      resourceType: 'customer',
      resourceId: customer._id,
      req,
    });

    return sendSuccess(res, customer, 'Customer updated successfully.');
  } catch (err) {
    next(err);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findOneAndDelete({
      _id: customerId,
      businessId: req.business._id,
    });

    if (!customer) {
      return sendError(res, 'Customer not found.', 404, 'NOT_FOUND');
    }

    await recordAuditLog({
      businessId: req.business._id,
      actorUserId: req.user._id,
      action: 'customer.deleted',
      resourceType: 'customer',
      resourceId: customerId,
      req,
    });

    return sendSuccess(res, null, 'Customer deleted successfully.');
  } catch (err) {
    next(err);
  }
};
