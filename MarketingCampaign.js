import mongoose from 'mongoose';

export const CAMPAIGN_CHANNELS = [
  'social_media',
  'email',
  'search',
  'paid_ads',
  'referral',
  'offline',
  'other'
];

export const CAMPAIGN_STATUSES = ['draft', 'active', 'paused', 'completed'];

const marketingCampaignSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
    },
    channel: {
      type: String,
      enum: CAMPAIGN_CHANNELS,
      required: true,
      default: 'social_media',
      index: true,
    },
    budgetMinor: {
      type: Number,
      default: 0,
      min: 0,
    },
    spentMinor: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: CAMPAIGN_STATUSES,
      default: 'draft',
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    leadsGenerated: {
      type: Number,
      default: 0,
    },
    conversions: {
      type: Number,
      default: 0,
    },
    revenueMinor: {
      type: Number,
      default: 0,
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

marketingCampaignSchema.index({ businessId: 1, status: 1 });
marketingCampaignSchema.index({ businessId: 1, channel: 1 });

export const MarketingCampaign = mongoose.model('MarketingCampaign', marketingCampaignSchema);
