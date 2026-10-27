import { Transaction } from '../models/Transaction.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { recordAuditLog } from '../services/auditService.js';
import { getTimeframeBounds } from '../services/analyticsService.js';

export const listTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 25,
      type,
      category,
      paymentMethod,
      timeframe = '30d',
      startDate,
      endDate,
      search = '',
      sortBy = 'transactionDate',
      order = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { businessId: req.business._id };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    if (timeframe || startDate || endDate) {
      const { start, end } = getTimeframeBounds(timeframe, startDate, endDate);
      filter.transactionDate = { $gte: start, $lte: end };
    }

    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('customerId', 'name companyName')
        .populate('invoiceId', 'invoiceNumber')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    return sendSuccess(res, transactions, null, 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

export const createTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.create({
      ...req.body,
      businessId: req.business._id,
      createdBy: req.user._id,
    });

    await recordAuditLog({
      businessId: req.business._id,
      actorUserId: req.user._id,
      action: 'transaction.recorded',
      resourceType: 'transaction',
      resourceId: transaction._id,
      metadata: { type: transaction.type, amountMinor: transaction.amountMinor },
      req,
    });

    return sendSuccess(res, transaction, 'Transaction recorded successfully.', 201);
  } catch (err) {
    next(err);
  }
};

export const getTransaction = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findOne({ _id: transactionId, businessId: req.business._id })
      .populate('customerId', 'name companyName')
      .populate('invoiceId', 'invoiceNumber totalMinor');

    if (!transaction) {
      return sendError(res, 'Transaction not found.', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, transaction);
  } catch (err) {
    next(err);
  }
};

export const deleteTransaction = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findOneAndDelete({
      _id: transactionId,
      businessId: req.business._id,
    });

    if (!transaction) {
      return sendError(res, 'Transaction not found.', 404, 'NOT_FOUND');
    }

    await recordAuditLog({
      businessId: req.business._id,
      actorUserId: req.user._id,
      action: 'transaction.deleted',
      resourceType: 'transaction',
      resourceId: transactionId,
      req,
    });

    return sendSuccess(res, null, 'Transaction deleted successfully.');
  } catch (err) {
    next(err);
  }
};

export const getFinanceSummary = async (req, res, next) => {
  try {
    const { timeframe = '30d', startDate, endDate } = req.query;
    const { start, end } = getTimeframeBounds(timeframe, startDate, endDate);

    const aggregates = await Transaction.aggregate([
      {
        $match: {
          businessId: req.business._id,
          transactionDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$type',
          totalMinor: { $sum: '$amountMinor' },
          count: { $sum: 1 },
        },
      },
    ]);

    let incomeMinor = 0;
    let expenseMinor = 0;

    aggregates.forEach((agg) => {
      if (agg._id === 'income') incomeMinor = agg.totalMinor;
      if (agg._id === 'expense') expenseMinor = agg.totalMinor;
    });

    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          businessId: req.business._id,
          transactionDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          totalMinor: { $sum: '$amountMinor' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalMinor: -1 } },
    ]);

    return sendSuccess(res, {
      incomeMinor,
      expenseMinor,
      netCashFlowMinor: incomeMinor - expenseMinor,
      currency: req.business.currency,
      categoryBreakdown: categoryBreakdown.map((item) => ({
        type: item._id.type,
        category: item._id.category,
        totalMinor: item.totalMinor,
        count: item.count,
      })),
    });
  } catch (err) {
    next(err);
  }
};
