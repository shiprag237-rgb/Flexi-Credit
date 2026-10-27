import { verifyToken } from '../utils/token.js';
import { User } from '../models/User.js';
import { sendError } from '../utils/responseFormatter.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Check HTTP-only cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      // Fallback to Bearer token header
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Authentication required. Please sign in.', 401, 'UNAUTHORIZED');
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return sendError(res, 'Session expired or invalid token. Please sign in again.', 401, 'UNAUTHORIZED');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return sendError(res, 'User account no longer exists.', 401, 'UNAUTHORIZED');
    }

    if (user.status === 'suspended') {
      return sendError(res, 'Your user account has been suspended.', 403, 'ACCOUNT_SUSPENDED');
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[AuthMiddleware] Error:', err);
    return sendError(res, 'Authentication failed.', 500, 'AUTH_ERROR');
  }
};

export const requirePlatformAdmin = (req, res, next) => {
  if (!req.user || !req.user.isPlatformAdmin) {
    return sendError(res, 'Access denied. Platform Super Administrator privilege required.', 403, 'FORBIDDEN');
  }
  next();
};
