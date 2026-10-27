import { hasPermission, ROLES } from '../policies/roleDefinitions.js';
import { sendError } from '../utils/responseFormatter.js';

/**
 * Enforces role-based action permission checks
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    // Platform super admins pass through if auditing
    if (req.user && req.user.isPlatformAdmin) {
      return next();
    }

    if (!req.userRole) {
      return sendError(res, 'Access denied. No active membership role.', 403, 'FORBIDDEN');
    }

    // Check custom permissions first if present on membership
    if (req.membership && Array.isArray(req.membership.customPermissions) && req.membership.customPermissions.includes(permission)) {
      return next();
    }

    if (!hasPermission(req.userRole, permission)) {
      return sendError(
        res,
        `Access denied. Your role (${req.userRole}) lacks the '${permission}' permission.`,
        403,
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    next();
  };
};

/**
 * Enforces specific role membership (e.g. Owner only)
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (req.user && req.user.isPlatformAdmin) {
      return next();
    }

    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return sendError(
        res,
        `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}.`,
        403,
        'ROLE_UNAUTHORIZED'
      );
    }

    next();
  };
};
