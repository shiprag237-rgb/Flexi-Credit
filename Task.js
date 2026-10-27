import mongoose from 'mongoose';

export const TASK_STATUSES = ['todo', 'in_progress', 'in_review', 'completed'];
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const taskSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'todo',
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
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

taskSchema.index({ businessId: 1, assignedTo: 1, status: 1 });
taskSchema.index({ businessId: 1, projectId: 1, status: 1 });

export const Task = mongoose.model('Task', taskSchema);
