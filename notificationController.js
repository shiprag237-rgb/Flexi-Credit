import { Notification } from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

export const listNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      businessId: req.business._id,
      recipientUserId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      businessId: req.business._id,
      recipientUserId: req.user._id,
      readAt: null,
    });

    return sendSuccess(res, {
      notifications,
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        businessId: req.business._id,
        recipientUserId: req.user._id,
      },
      { $set: { readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      return sendError(res, 'Notification not found.', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, notification, 'Notification marked as read.');
  } catch (err) {
    next(err);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      {
        businessId: req.business._id,
        recipientUserId: req.user._id,
        readAt: null,
      },
      { $set: { readAt: new Date() } }
    );

    return sendSuccess(res, null, 'All notifications marked as read.');
  } catch (err) {
    next(err);
  }
};
