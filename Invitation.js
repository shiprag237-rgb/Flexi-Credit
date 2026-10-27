import mongoose from 'mongoose';
import { ROLES } from '../policies/roleDefinitions.js';

const invitationSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      enum: [ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.ACCOUNTANT],
      default: ROLES.EMPLOYEE,
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'revoked', 'expired'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

invitationSchema.index({ businessId: 1, email: 1 });

export const Invitation = mongoose.model('Invitation', invitationSchema);
