import { User } from '../models/User.js';
import { Business } from '../models/Business.js';
import { BusinessMembership } from '../models/BusinessMembership.js';
import { Subscription } from '../models/Subscription.js';
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/token.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { recordAuditLog } from '../services/auditService.js';
import { ROLES } from '../policies/roleDefinitions.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, businessName, industry, businessSize } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 'An account with this email address already exists.', 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
      emailVerifiedAt: new Date(),
    });

    let defaultBusiness = null;

    // If business details provided during registration, bootstrap initial workspace
    if (businessName) {
      const baseSlug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'workspace';
      let uniqueSlug = baseSlug;
      let counter = 1;
      while (await Business.findOne({ slug: uniqueSlug })) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      defaultBusiness = await Business.create({
        name: businessName,
        slug: uniqueSlug,
        industry: industry || 'services',
        businessSize: businessSize || '1-10',
        ownerUserId: user._id,
      });

      // Assign Owner membership
      await BusinessMembership.create({
        businessId: defaultBusiness._id,
        userId: user._id,
        role: ROLES.OWNER,
      });

      // Initialize default Free subscription
      await Subscription.create({
        businessId: defaultBusiness._id,
        planId: 'free',
        status: 'active',
      });

      await recordAuditLog({
        businessId: defaultBusiness._id,
        actorUserId: user._id,
        action: 'business.created',
        resourceType: 'business',
        resourceId: defaultBusiness._id,
        req,
      });
    }

    const token = generateToken({ userId: user._id, email: user.email });
    setAuthCookie(res, token);

    return sendSuccess(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          isPlatformAdmin: user.isPlatformAdmin,
        },
        token,
        business: defaultBusiness,
      },
      'Registration successful.',
      201
    );
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return sendError(res, 'Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    if (user.status === 'suspended') {
      return sendError(res, 'Your user account has been suspended.', 403, 'ACCOUNT_SUSPENDED');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken({ userId: user._id, email: user.email });
    setAuthCookie(res, token);

    // Fetch user's workspaces
    const memberships = await BusinessMembership.find({ userId: user._id, status: 'active' })
      .populate('businessId')
      .lean();

    const workspaces = memberships
      .filter((m) => m.businessId && m.businessId.status !== 'archived')
      .map((m) => ({
        businessId: m.businessId._id,
        name: m.businessId.name,
        slug: m.businessId.slug,
        role: m.role,
        currency: m.businessId.currency,
        industry: m.businessId.industry,
      }));

    return sendSuccess(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          isPlatformAdmin: user.isPlatformAdmin,
        },
        token,
        workspaces,
      },
      'Login successful.'
    );
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res) => {
  clearAuthCookie(res);
  return sendSuccess(res, null, 'Logged out successfully.');
};

export const getMe = async (req, res, next) => {
  try {
    const memberships = await BusinessMembership.find({ userId: req.user._id, status: 'active' })
      .populate('businessId')
      .lean();

    const workspaces = memberships
      .filter((m) => m.businessId && m.businessId.status !== 'archived')
      .map((m) => ({
        businessId: m.businessId._id,
        name: m.businessId.name,
        slug: m.businessId.slug,
        role: m.role,
        currency: m.businessId.currency,
        industry: m.businessId.industry,
        logoUrl: m.businessId.logoUrl,
      }));

    return sendSuccess(res, {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatarUrl: req.user.avatarUrl,
        isPlatformAdmin: req.user.isPlatformAdmin,
      },
      workspaces,
    });
  } catch (err) {
    next(err);
  }
};
