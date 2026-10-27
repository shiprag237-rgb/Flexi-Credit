import mongoose from 'mongoose';

export const LEAD_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

const leadSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Lead contact name is required'],
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      enum: ['website', 'referral', 'campaign', 'cold_outreach', 'event', 'social', 'other'],
      default: 'website',
    },
    stage: {
      type: String,
      enum: LEAD_STAGES,
      default: 'new',
      index: true,
    },
    estimatedValueMinor: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketingCampaign',
      index: true,
    },
    nextFollowUpAt: {
      type: Date,
      default: null,
    },
    lostReason: {
      type: String,
      default: '',
    },
    convertedCustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

leadSchema.index({ businessId: 1, stage: 1 });
leadSchema.index({ businessId: 1, assignedTo: 1 });
leadSchema.index({ businessId: 1, createdAt: -1 });

export const Lead = mongoose.model('Lead', leadSchema);
