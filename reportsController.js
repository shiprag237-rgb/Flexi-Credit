import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { Invoice } from '../models/Invoice.js';
import { Lead } from '../models/Lead.js';
import { Customer } from '../models/Customer.js';
import { Product } from '../models/Product.js';
import { getTimeframeBounds } from '../services/analyticsService.js';
import { sendSuccess } from '../utils/responseFormatter.js';

export const getRevenueReport = async (req, res, next) => {
  try {
    const { timeframe = '30d', startDate, endDate, format } = req.query;
    const { start, end } = getTimeframeBounds(timeframe, startDate, endDate);
    const bId = req.business._id;

    const invoices = await Invoice.find({
      businessId: bId,
      status: { $ne: 'cancelled' },
      createdAt: { $gte: start, $lte: end },
    })
      .populate('customerId', 'name companyName')
      .sort({ createdAt: -1 })
      .lean();

    const totalInvoicedMinor = invoices.reduce((acc, inv) => acc + inv.totalMinor, 0);
    const totalCollectedMinor = invoices.reduce((acc, inv) => acc + inv.paidMinor, 0);
    const outstandingMinor = invoices.reduce((acc, inv) => acc + inv.balanceMinor, 0);

    if (format === 'csv') {
      let csv = 'Invoice Number,Customer,Issue Date,Due Date,Status,Total,Paid,Balance\n';
      invoices.forEach((inv) => {
        const cust = (inv.customerId?.name || 'Customer').replace(/,/g, '');
        csv += `${inv.invoiceNumber},${cust},${inv.issueDate?.toISOString().slice(0, 10)},${inv.dueDate?.toISOString().slice(0, 10)},${inv.status},${(inv.totalMinor / 100).toFixed(2)},${(inv.paidMinor / 100).toFixed(2)},${(inv.balanceMinor / 100).toFixed(2)}\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="revenue-report-${timeframe}.csv"`);
      return res.status(200).send(csv);
    }

    return sendSuccess(res, {
      summary: {
        totalInvoicedMinor,
        totalCollectedMinor,
        outstandingMinor,
        invoiceCount: invoices.length,
        currency: req.business.currency,
      },
      invoices,
    });
  } catch (err) {
    next(err);
  }
};

export const getExpenseReport = async (req, res, next) => {
  try {
    const { timeframe = '30d', startDate, endDate, format } = req.query;
    const { start, end } = getTimeframeBounds(timeframe, startDate, endDate);
    const bId = req.business._id;

    const expenses = await Transaction.find({
      businessId: bId,
      type: 'expense',
      transactionDate: { $gte: start, $lte: end },
    })
      .sort({ transactionDate: -1 })
      .lean();

    const totalExpenseMinor = expenses.reduce((acc, exp) => acc + exp.amountMinor, 0);

    // Group by category
    const byCategory = {};
    expenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amountMinor;
    });

    if (format === 'csv') {
      let csv = 'Date,Category,Description,Payment Method,Amount,Reference\n';
      expenses.forEach((exp) => {
        csv += `${exp.transactionDate?.toISOString().slice(0, 10)},${exp.category},"${(exp.description || '').replace(/"/g, '""')}",${exp.paymentMethod},${(exp.amountMinor / 100).toFixed(2)},${exp.reference || ''}\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="expenses-report-${timeframe}.csv"`);
      return res.status(200).send(csv);
    }

    return sendSuccess(res, {
      summary: {
        totalExpenseMinor,
        expenseCount: expenses.length,
        currency: req.business.currency,
        byCategory,
      },
      expenses,
    });
  } catch (err) {
    next(err);
  }
};

export const getProfitReport = async (req, res, next) => {
  try {
    const { timeframe = '30d', startDate, endDate } = req.query;
    const { start, end } = getTimeframeBounds(timeframe, startDate, endDate);
    const bId = req.business._id;

    const aggregates = await Transaction.aggregate([
      {
        $match: {
          businessId: bId,
          transactionDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$type',
          totalMinor: { $sum: '$amountMinor' },
        },
      },
    ]);

    let incomeMinor = 0;
    let expenseMinor = 0;
    aggregates.forEach((a) => {
      if (a._id === 'income') incomeMinor = a.totalMinor;
      if (a._id === 'expense') expenseMinor = a.totalMinor;
    });

    const netProfitMinor = incomeMinor - expenseMinor;
    const profitMargin = incomeMinor > 0 ? Math.round((netProfitMinor / incomeMinor) * 100) : 0;

    return sendSuccess(res, {
      timeframe: { start, end },
      revenueMinor: incomeMinor,
      expenseMinor,
      netProfitMinor,
      profitMarginPercentage: profitMargin,
      currency: req.business.currency,
    });
  } catch (err) {
    next(err);
  }
};

export const getLeadConversionReport = async (req, res, next) => {
  try {
    const bId = req.business._id;
    const [totalLeads, wonLeads, lostLeads, leadsBySource] = await Promise.all([
      Lead.countDocuments({ businessId: bId }),
      Lead.countDocuments({ businessId: bId, stage: 'won' }),
      Lead.countDocuments({ businessId: bId, stage: 'lost' }),
      Lead.aggregate([
        { $match: { businessId: bId } },
        {
          $group: {
            _id: '$source',
            count: { $sum: 1 },
            wonCount: {
              $sum: { $cond: [{ $eq: ['$stage', 'won'] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

    return sendSuccess(res, {
      totalLeads,
      wonLeads,
      lostLeads,
      conversionRatePercentage: conversionRate,
      bySource: leadsBySource.map((s) => ({
        source: s._id,
        count: s.count,
        wonCount: s.wonCount,
        conversionRate: s.count > 0 ? Math.round((s.wonCount / s.count) * 100) : 0,
      })),
    });
  } catch (err) {
    next(err);
  }
};
