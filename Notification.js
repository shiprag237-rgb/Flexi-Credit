import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = [
  'task_assigned',
  'task_due',
  'lead_new',
  'invoice_paid',
  'invoice_overdue',
  'low_stock',
  'team_invite',
  'system'
];

const notificationSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      default: '',
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ businessId: 1, recipientUserId: 1, readAt: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
