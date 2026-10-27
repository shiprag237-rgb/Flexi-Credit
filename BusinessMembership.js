import mongoose from 'mongoose';
import { ROLES } from '../policies/roleDefinitions.js';

const businessMembershipSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.EMPLOYEE,
      required: true,
    },
    customPermissions: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'deactivated'],
      default: 'active',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring a user can have only one active membership per business
businessMembershipSchema.index({ businessId: 1, userId: 1 }, { unique: true });

export const BusinessMembership = mongoose.model('BusinessMembership', businessMembershipSchema);
