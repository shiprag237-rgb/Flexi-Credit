import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { Invoice } from '../models/Invoice.js';
import { Customer } from '../models/Customer.js';
import { Lead } from '../models/Lead.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { Product } from '../models/Product.js';

/**
 * Computes date boundaries given a timeframe identifier
 */
export const getTimeframeBounds = (timeframe = '30d', customStart = null, customEnd = null) => {
  const now = new Date();
  let start = new Date();
  let end = new Date(now);

  switch (timeframe) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case '7d':
      start.setDate(now.getDate() - 7);
      break;
    case '30d':
      start.setDate(now.getDate() - 30);
      break;
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'previous_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'quarter':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), currentQuarter * 3, 1);
      end = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59, 999);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case 'custom':
      if (customStart) start = new Date(customStart);
      if (customEnd) end = new Date(customEnd);
      break;
    default:
      start.setDate(now.getDate() - 30);
  }

  return { start, end };
};

/**
 * Generates the full executive business dashboard summary based on actual MongoDB records
 */
export const getDashboardSummary = async (businessId, timeframe = '30d', customStart = null, customEnd = null) => {
  const bId = new mongoose.Types.ObjectId(businessId);
  const { start, end } = getTimeframeBounds(timeframe, customStart, customEnd);

  // 1. Transactions Aggregation (Collected Cash In, Cash Out, Net Cash Flow)
  const transactionStats = await Transaction.aggregate([
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
        count: { $sum: 1 },
      },
    },
  ]);

  let collectedRevenueMinor = 0;
  let totalExpensesMinor = 0;

  transactionStats.forEach((stat) => {
    if (stat._id === 'income') collectedRevenueMinor = stat.totalMinor;
    if (stat._id === 'expense') totalExpensesMinor = stat.totalMinor;
  });

  const netCashFlowMinor = collectedRevenueMinor - totalExpensesMinor;

  // 2. Invoicing Stats (Total Invoiced Revenue & Outstanding Payments)
  const invoiceStats = await Invoice.aggregate([
    {
      $match: {
        businessId: bId,
        status: { $ne: 'cancelled' },
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: null,
        totalInvoicedMinor: { $sum: '$totalMinor' },
        outstandingBalanceMinor: { $sum: '$balanceMinor' },
        count: { $sum: 1 },
      },
    },
  ]);

  const invoicedRevenueMinor = invoiceStats[0]?.totalInvoicedMinor || 0;
  const outstandingPaymentsMinor = invoiceStats[0]?.outstandingBalanceMinor || 0;

  // 3. Operational Counts (Customers, Leads, Projects, Tasks, Low Stock)
  const [
    totalCustomers,
    newLeads,
    activeProjects,
    pendingTasks,
    lowStockProducts,
    overdueInvoices,
  ] = await Promise.all([
    Customer.countDocuments({ businessId: bId, status: 'active' }),
    Lead.countDocuments({ businessId: bId, createdAt: { $gte: start, $lte: end } }),
    Project.countDocuments({ businessId: bId, status: { $in: ['planning', 'in_progress'] } }),
    Task.countDocuments({ businessId: bId, status: { $in: ['todo', 'in_progress', 'in_review'] } }),
    Product.countDocuments({
      businessId: bId,
      trackInventory: true,
      $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
    }),
    Invoice.find({
      businessId: bId,
      status: { $in: ['sent', 'partially_paid'] },
      dueDate: { $lt: new Date() },
    })
      .populate('customerId', 'name companyName')
      .sort({ dueDate: 1 })
      .limit(5),
  ]);

  // 4. Time-series Revenue & Expense Trend (daily or monthly depending on timeframe)
  const revenueTrend = await Transaction.aggregate([
    {
      $match: {
        businessId: bId,
        transactionDate: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$transactionDate' } },
          type: '$type',
        },
        total: { $sum: '$amountMinor' },
      },
    },
    { $sort: { '_id.date': 1 } },
  ]);

  // Transform trend into charting friendly structure
  const trendMap = {};
  revenueTrend.forEach((item) => {
    const d = item._id.date;
    if (!trendMap[d]) trendMap[d] = { date: d, income: 0, expense: 0, profit: 0 };
    if (item._id.type === 'income') trendMap[d].income = item.total / 100;
    if (item._id.type === 'expense') trendMap[d].expense = item.total / 100;
    trendMap[d].profit = trendMap[d].income - trendMap[d].expense;
  });
  const chartTrends = Object.values(trendMap);

  // 5. Expense Breakdown by Category
  const expenseByCategory = await Transaction.aggregate([
    {
      $match: {
        businessId: bId,
        type: 'expense',
        transactionDate: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: '$category',
        totalMinor: { $sum: '$amountMinor' },
      },
    },
    { $sort: { totalMinor: -1 } },
  ]);

  // 6. Lead Conversion Funnel
  const leadFunnel = await Lead.aggregate([
    { $match: { businessId: bId } },
    {
      $group: {
        _id: '$stage',
        count: { $sum: 1 },
        totalValueMinor: { $sum: '$estimatedValueMinor' },
      },
    },
  ]);

  // 7. Project Status Distribution
  const projectDistribution = await Project.aggregate([
    { $match: { businessId: bId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  // 8. Recent Activities & Upcoming Deadlines
  const recentTransactions = await Transaction.find({ businessId: bId })
    .sort({ transactionDate: -1 })
    .limit(5);

  const upcomingTasks = await Task.find({
    businessId: bId,
    status: { $ne: 'completed' },
    dueDate: { $gte: new Date() },
  })
    .populate('assignedTo', 'name email avatarUrl')
    .sort({ dueDate: 1 })
    .limit(5);

  return {
    timeframe: {
      key: timeframe,
      start,
      end,
    },
    metrics: {
      collectedRevenueMinor,
      invoicedRevenueMinor,
      totalExpensesMinor,
      netCashFlowMinor,
      outstandingPaymentsMinor,
      totalCustomers,
      newLeads,
      activeProjects,
      pendingTasks,
      lowStockProducts,
    },
    charts: {
      revenueExpenseTrend: chartTrends,
      expenseByCategory: expenseByCategory.map((c) => ({
        category: c._id,
        amount: c.totalMinor / 100,
        amountMinor: c.totalMinor,
      })),
      leadFunnel: leadFunnel.map((l) => ({
        stage: l._id,
        count: l.count,
        totalValue: l.totalValueMinor / 100,
      })),
      projectDistribution: projectDistribution.map((p) => ({
        status: p._id,
        count: p.count,
      })),
    },
    recent: {
      transactions: recentTransactions,
      upcomingTasks,
      overdueInvoices,
    },
  };
};
