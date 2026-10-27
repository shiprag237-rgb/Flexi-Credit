import mongoose from 'mongoose';

export const PROJECT_STATUSES = ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'];

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      index: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    teamMemberIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: 'planning',
      index: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    budgetMinor: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    milestones: [milestoneSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ businessId: 1, status: 1 });
projectSchema.index({ businessId: 1, managerId: 1 });
projectSchema.index({ businessId: 1, customerId: 1 });

export const Project = mongoose.model('Project', projectSchema);
