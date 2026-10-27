import mongoose from 'mongoose';

const leadActivitySchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['note', 'call', 'email', 'meeting', 'stage_change', 'follow_up'],
      default: 'note',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

leadActivitySchema.index({ businessId: 1, leadId: 1, createdAt: -1 });

export const LeadActivity = mongoose.model('LeadActivity', leadActivitySchema);
