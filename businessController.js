import crypto from 'crypto';
import { Business } from '../models/Business.js';
import { BusinessMembership } from '../models/BusinessMembership.js';
import { Subscription } from '../models/Subscription.js';
import { Invitation } from '../models/Invitation.js';
import { User } from '../models/User.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { recordAuditLog } from '../services/auditService.js';
import { ROLES } from '../policies/roleDefinitions.js';
import { SUBSCRIPTION_PLANS } from '../config/plans.js';

export const createBusiness = async (req, res, next) => {
  try {
    const { name, industry, businessSize, currency, timezone, settings } = req.body;

    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'workspace';
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await Business.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const business = await Business.create({
      name,
      slug: uniqueSlug,
      industry: industry || 'services',
      businessSize: businessSize || '1-10',
      currency: currency || 'USD',
      timezone: timezone || 'UTC',
      ownerUserId: req.user._id,
      settings: settings ? {
        invoicePrefix: settings.invoicePrefix || 'INV-',
        taxRatePercentage: settings.taxRatePercentage ?? settings.taxRatePercent ?? 0,
        inventoryEnabled: settings.inventoryEnabled !== false,
      } : undefined,
    });

    await BusinessMembership.create({
      businessId: business._id,
      userId: req.user._id,
      role: ROLES.OWNER,
    });

    await Subscription.create({
      businessId: business._id,
      planId: 'free',
      status: 'active',
    });

    await recordAuditLog({
      businessId: business._id,
      actorUserId: req.user._id,
      action: 'business.created',
      resourceType: 'business',
      resourceId: business._id,
      req,
    });

    return sendSuccess(res, business, 'Business workspace created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

export const listUserBusinesses = async (req, res, next) => {
  try {
    const memberships = await BusinessMembership.find({ userId: req.user._id, status: 'active' })
      .populate('businessId')
      .lean();

    const businesses = memberships
      .filter((m) => m.businessId && m.businessId.status !== 'archived')
      .map((m) => ({
        ...m.businessId,
        userRole: m.role,
        joinedAt: m.joinedAt,
      }));

    return sendSuccess(res, businesses);
  } catch (err) {
    next(err);
  }
};

export const getBusinessDetails = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ businessId: req.business._id });
    const plan = SUBSCRIPTION_PLANS[subscription?.planId || 'free'];

    return sendSuccess(res, {
      ...req.business.toObject(),
      userRole: req.userRole,
      subscription: {
        planId: subscription?.planId || 'free',
        planName: plan.name,
        status: subscription?.status || 'active',
        limits: plan.limits,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateBusiness = async (req, res, next) => {
  try {
    const allowedUpdates = ['name', 'industry', 'businessSize', 'currency', 'timezone', 'logoUrl', 'settings'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'settings') {
          req.business.settings = { ...req.business.settings.toObject(), ...req.body.settings };
        } else {
          req.business[field] = req.body[field];
        }
      }
    });

    await req.business.save();

    await recordAuditLog({
      businessId: req.business._id,
      actorUserId: req.user._id,
      action: 'business.settings_updated',
      resourceType: 'business',
      resourceId: req.business._id,
      metadata: req.body,
      req,
    });

    return sendSuccess(res, req.business, 'Business workspace updated successfully.');
  } catch (err) {
    next(err);
  }
};

export const getMembers = async (req, res, next) => {
  try {
    const members = await BusinessMembership.find({ businessId: req.business._id })
      .populate('userId', 'name email avatarUrl status lastLoginAt')
      .lean();

    const pendingInvitations = await Invitation.find({
      businessId: req.business._id,
      status: 'pending',
    }).lean();

    return sendSuccess(res, {
      members: members.map((m) => ({
        id: m._id,
        userId: m.userId?._id,
        name: m.userId?.name || 'Unknown',
        email: m.userId?.email || '',
        avatarUrl: m.userId?.avatarUrl || '',
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt,
      })),
      pendingInvitations: pendingInvitations.map((inv) => ({
        id: inv._id,
        email: inv.email,
        role: inv.role,
        expiresAt: inv.expiresAt,
        status: inv.status,
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const inviteMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    // Check membership limits on subscription
    const subscription = await Subscription.findOne({ businessId: req.business._id });
    const plan = SUBSCRIPTION_PLANS[subscription?.planId || 'free'];
    const currentMemberCount = await BusinessMembership.countDocuments({
      businessId: req.business._id,
      status: 'active',
    });

    if (currentMemberCount >= plan.limits.maxTeamMembers) {
      return sendError(
        res,
        `Your current plan (${plan.name}) allows up to ${plan.limits.maxTeamMembers} team members. Please upgrade your plan.`,
        403,
        'LIMIT_REACHED'
      );
    }

    // Check if user is already a member
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const existingMembership = await BusinessMembership.findOne({
        businessId: req.business._id,
        userId: existingUser._id,
      });
      if (existingMembership) {
        return sendError(res, 'This user is already a member of this workspace.', 409, 'ALREADY_MEMBER');
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await Invitation.create({
      businessId: req.business._id,
      email,
      role,
      token,
      invitedBy: req.user._id,
      expiresAt,
    });

    // If invited user already has an account, we can immediately add them or let them accept
    if (existingUser) {
      await BusinessMembership.create({
        businessId: req.business._id,
        userId: existingUser._id,
        role,
        status: 'active',
      });
      invitation.status = 'accepted';
      await invitation.save();
    }

    await recordAuditLog({
      businessId: req.business._id,
      actorUserId: req.user._id,
      action: 'team.member_invited',
      resourceType: 'invitation',
      resourceId: invitation._id,
      metadata: { email, role },
      req,
    });

    return sendSuccess(res, invitation, 'Team member invited successfully.', 201);
  } catch (err) {
    next(err);
  }
};

export const updateMemberRole = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { role } = req.body;

    const membership = await BusinessMembership.findOne({
      _id: memberId,
      businessId: req.business._id,
    });

    if (!membership) {
      return sendError(res, 'Member not found.', 404, 'NOT_FOUND');
    }

    if (membership.role === ROLES.OWNER) {
      return sendError(res, 'Cannot change the role of the workspace Owner.', 403, 'FORBIDDEN');
    }

    membership.role = role;
    await membership.save();

    await recordAuditLog({
      businessId: req.business._id,
      actorUserId: req.user._id,
      action: 'team.role_updated',
      resourceType: 'membership',
      resourceId: membership._id,
      metadata: { newRole: role },
      req,
    });

    return sendSuccess(res, membership, 'Member role updated successfully.');
  } catch (err) {
    next(err);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;

    const membership = await BusinessMembership.findOne({
      _id: memberId,
      businessId: req.business._id,
    });

    if (!membership) {
      return sendError(res, 'Member not found.', 404, 'NOT_FOUND');
    }

    if (membership.role === ROLES.OWNER) {
      return sendError(res, 'The workspace Owner cannot be removed.', 403, 'FORBIDDEN');
    }

    await BusinessMembership.findByIdAndDelete(memberId);

    await recordAuditLog({
      businessId: req.business._id,
      actorUserId: req.user._id,
      action: 'team.member_removed',
      resourceType: 'membership',
      resourceId: memberId,
      req,
    });

    return sendSuccess(res, null, 'Member removed from workspace.');
  } catch (err) {
    next(err);
  }
};
