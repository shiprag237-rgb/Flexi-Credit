import { Subscription } from '../models/Subscription.js';
import { Customer } from '../models/Customer.js';
import { Project } from '../models/Project.js';
import { BusinessMembership } from '../models/BusinessMembership.js';
import { Invoice } from '../models/Invoice.js';
import { SUBSCRIPTION_PLANS } from '../config/plans.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { recordAuditLog } from '../services/auditService.js';

export const getSubscription = async (req, res, next) => {
  try {
    let subscription = await Subscription.findOne({ businessId: req.business._id });
    if (!subscription) {
      subscription = await Subscription.create({
        businessId: req.business._id,
        planId: 'free',
        status: 'active',
      });
    }

    const currentPlan = SUBSCRIPTION_PLANS[subscription.planId] || SUBSCRIPTION_PLANS.free;

    // Calculate actual current usage metrics
    const [teamCount, customerCount, projectCount, monthlyInvoiceCount] = await Promise.all([
      BusinessMembership.countDocuments({ businessId: req.business._id, status: 'active' }),
      Customer.countDocuments({ businessId: req.business._id, status: 'active' }),
      Project.countDocuments({ businessId: req.business._id, status: { $in: ['planning', 'in_progress'] } }),
      Invoice.countDocuments({
        businessId: req.business._id,
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
    ]);

    return sendSuccess(res, {
      subscription: {
        id: subscription._id,
        planId: subscription.planId,
        planName: currentPlan.name,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        isSandboxDemo: true, // Clearly indicate development sandbox
      },
      plan: currentPlan,
      usage: {
        teamMembers: { current: teamCount, limit: currentPlan.limits.maxTeamMembers },
        customers: { current: customerCount, limit: currentPlan.limits.maxCustomers },
        projects: { current: projectCount, limit: currentPlan.limits.maxProjects },
        monthlyInvoices: { current: monthlyInvoiceCount, limit: currentPlan.limits.maxInvoicesPerMonth },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const listPlans = async (req, res) => {
  return sendSuccess(res, Object.values(SUBSCRIPTION_PLANS));
};

export const checkoutSandboxPlan = async (req, res, next) => {
  try {
    const { planId, billingCycle = 'monthly' } = req.body;

    if (!SUBSCRIPTION_PLANS[planId]) {
      return sendError(res, 'Invalid subscription plan ID.', 400, 'INVALID_PLAN');
    }

    let subscription = await Subscription.findOne({ businessId: req.business._id });
    if (!subscription) {
      subscription = new Subscription({ businessId: req.business._id });
    }

    const oldPlan = subscription.planId;
    subscription.planId = planId;
    subscription.billingCycle = billingCycle;
    subscription.status = 'active';
    subscription.cancelAtPeriodEnd = false;
    subscription.currentPeriodStart = new Date();
    subscription.currentPeriodEnd = new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);
    await subscription.save();

    await recordAuditLog({
      businessId: req.business._id,
      actorUserId: req.user._id,
      action: 'subscription.tier_changed',
      resourceType: 'subscription',
      resourceId: subscription._id,
      metadata: { oldPlan, newPlan: planId, billingCycle, mode: 'sandbox' },
      req,
    });

    return sendSuccess(
      res,
      subscription,
      `[Sandbox] Workspace successfully updated to ${SUBSCRIPTION_PLANS[planId].name} plan.`
    );
  } catch (err) {
    next(err);
  }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ businessId: req.business._id });
    if (!subscription) {
      return sendError(res, 'Subscription not found.', 404, 'NOT_FOUND');
    }

    subscription.cancelAtPeriodEnd = true;
    await subscription.save();

    await recordAuditLog({
      businessId: req.business._id,
      actorUserId: req.user._id,
      action: 'subscription.cancelled',
      resourceType: 'subscription',
      resourceId: subscription._id,
      req,
    });

    return sendSuccess(res, subscription, 'Subscription will be cancelled at the end of the billing period.');
  } catch (err) {
    next(err);
  }
};
