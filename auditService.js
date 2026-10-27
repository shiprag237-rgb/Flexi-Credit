import { AuditLog } from '../models/AuditLog.js';

export const recordAuditLog = async ({
  businessId = null,
  actorUserId = null,
  action,
  resourceType,
  resourceId = null,
  metadata = {},
  req = null,
}) => {
  try {
    let ipAddress = '';
    let userAgent = '';

    if (req) {
      ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      userAgent = req.headers['user-agent'] || '';
    }

    await AuditLog.create({
      businessId,
      actorUserId,
      action,
      resourceType,
      resourceId: resourceId ? String(resourceId) : null,
      metadata,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    console.error('[AuditService] Failed to record audit log:', err.message);
  }
};
