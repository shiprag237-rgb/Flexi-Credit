import mongoose from 'mongoose';
import { Business } from '../models/Business.js';
import { BusinessMembership } from '../models/BusinessMembership.js';
import { sendError } from '../utils/responseFormatter.js';

/**
 * Tenant resolution middleware.
 * Intercepts routes containing :businessId.
 * Verifies business existence, status, and the user's active membership.
 */
export const requireTenant = async (req, res, next) => {
  try {
    const { businessId } = req.params;

    if (!businessId) {
      return sendError(res, 'Business ID parameter is missing from route.', 400, 'BAD_REQUEST');
    }

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return sendError(res, 'Invalid Business ID format.', 400, 'INVALID_ID');
    }

    // Verify Business existence
    const business = await Business.findById(businessId);
    if (!business) {
      return sendError(res, 'Business workspace not found.', 404, 'NOT_FOUND');
    }

    if (business.status === 'suspended') {
      return sendError(res, 'This business workspace has been suspended.', 403, 'WORKSPACE_SUSPENDED');
    }

    // Verify User's Membership in this Business
    const membership = await BusinessMembership.findOne({
      businessId: business._id,
      userId: req.user._id,
      status: 'active',
    });

    if (!membership && !req.user.isPlatformAdmin) {
      return sendError(res, 'You do not have access to this business workspace.', 403, 'TENANT_FORBIDDEN');
    }

    // Attach validated tenant context to request
    req.business = business;
    req.businessId = business._id;
    req.membership = membership;
    req.userRole = membership ? membership.role : (req.user.isPlatformAdmin ? 'super_admin' : null);

    next();
  } catch (err) {
    console.error('[TenantMiddleware] Error:', err);
    return sendError(res, 'Tenant resolution failed.', 500, 'SERVER_ERROR');
  }
};
