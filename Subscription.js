import mongoose from 'mongoose';
import { SUBSCRIPTION_PLANS } from '../config/plans.js';

const subscriptionSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      unique: true,
      index: true,
    },
    planId: {
      type: String,
      enum: Object.keys(SUBSCRIPTION_PLANS),
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'canceled', 'unpaid'],
      default: 'active',
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    stripeCustomerId: {
      type: String,
      default: '',
    },
    stripeSubscriptionId: {
      type: String,
      default: '',
    },
    customLimits: {
      maxTeamMembers: Number,
      maxCustomers: Number,
      maxProjects: Number,
      maxInvoicesPerMonth: Number,
      inventoryEnabled: Boolean,
      marketingEnabled: Boolean,
      exportEnabled: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual to get active effective limits
subscriptionSchema.virtual('effectiveLimits').get(function () {
  const basePlan = SUBSCRIPTION_PLANS[this.planId] || SUBSCRIPTION_PLANS.free;
  return {
    ...basePlan.limits,
    ...(this.customLimits || {}),
  };
});

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
