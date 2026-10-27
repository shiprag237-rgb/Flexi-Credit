import { Business } from '../models/Business.js';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { AuditLog } from '../models/AuditLog.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { recordAuditLog } from '../services/auditService.js';

export const getPlatformStats = async (req, res, next) => {
  try {
    const [totalUsers, totalBusinesses, activeBusinesses, planDistribution] = await Promise.all([
      User.countDocuments(),
      Business.countDocuments(),
      Business.countDocuments({ status: 'active' }),
      Subscription.aggregate([
        {
          $group: {
            _id: '$planId',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return sendSuccess(res, {
      totalUsers,
      totalBusinesses,
      activeBusinesses,
      planDistribution: planDistribution.map((p) => ({ plan: p._id, count: p.count })),
    });
  } catch (err) {
    next(err);
  }
};

export const listAllBusinesses = async (req, res, next) => {
  try {
    const businesses = await Business.find()
      .populate('ownerUserId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const subscriptions = await Subscription.find().lean();
    const subMap = {};
    subscriptions.forEach((s) => {
      subMap[s.businessId.toString()] = s.planId;
    });

    const enriched = businesses.map((b) => ({
      ...b,
      planId: subMap[b._id.toString()] || 'free',
    }));

    return sendSuccess(res, enriched);
  } catch (err) {
    next(err);
  }
};

export const updateBusinessStatus = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'archived'].includes(status)) {
      return sendError(res, 'Invalid status.', 400, 'BAD_REQUEST');
    }

    const business = await Business.findByIdAndUpdate(businessId, { status }, { new: true });
    if (!business) {
      return sendError(res, 'Business not found.', 404, 'NOT_FOUND');
    }

    await recordAuditLog({
      businessId: business._id,
      actorUserId: req.user._id,
      action: 'platform.business_status_changed',
      resourceType: 'business',
      resourceId: business._id,
      metadata: { newStatus: status },
      req,
    });

    return sendSuccess(res, business, `Business workspace status updated to "${status}".`);
  } catch (err) {
    next(err);
  }
};

export const getPlatformAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate('actorUserId', 'name email')
      .populate('businessId', 'name slug')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return sendSuccess(res, logs);
  } catch (err) {
    next(err);
  }
};
