import { Task } from '../models/Task.js';
import { TaskComment } from '../models/TaskComment.js';
import { Notification } from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';

export const listTasks = async (req, res, next) => {
  try {
    const { projectId, assignedTo, status, priority, dueBefore, search = '' } = req.query;

    const filter = { businessId: req.business._id };

    if (projectId) filter.projectId = projectId;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (dueBefore) filter.dueDate = { $lte: new Date(dueBefore) };
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatarUrl')
      .populate('projectId', 'name status')
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    return sendSuccess(res, tasks);
  } catch (err) {
    next(err);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const task = await Task.create({
      ...req.body,
      businessId: req.business._id,
      createdBy: req.user._id,
    });

    // Notify assigned team member if assignedTo is another user
    if (task.assignedTo && String(task.assignedTo) !== String(req.user._id)) {
      await Notification.create({
        businessId: req.business._id,
        recipientUserId: task.assignedTo,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `${req.user.name} assigned you the task: "${task.title}"`,
        resourceType: 'task',
        resourceId: task._id,
      });
    }

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatarUrl')
      .populate('projectId', 'name');

    return sendSuccess(res, populatedTask, 'Task created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findOne({ _id: taskId, businessId: req.business._id });
    if (!task) {
      return sendError(res, 'Task not found.', 404, 'NOT_FOUND');
    }

    if (req.body.status === 'completed' && task.status !== 'completed') {
      req.body.completedAt = new Date();
    } else if (req.body.status && req.body.status !== 'completed') {
      req.body.completedAt = null;
    }

    Object.assign(task, req.body);
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatarUrl')
      .populate('projectId', 'name');

    return sendSuccess(res, updatedTask, 'Task updated successfully.');
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findOneAndDelete({
      _id: taskId,
      businessId: req.business._id,
    });
    if (!task) {
      return sendError(res, 'Task not found.', 404, 'NOT_FOUND');
    }
    await TaskComment.deleteMany({ businessId: req.business._id, taskId });
    return sendSuccess(res, null, 'Task deleted successfully.');
  } catch (err) {
    next(err);
  }
};

export const getTaskComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const comments = await TaskComment.find({ businessId: req.business._id, taskId })
      .populate('authorId', 'name email avatarUrl')
      .sort({ createdAt: 1 });
    return sendSuccess(res, comments);
  } catch (err) {
    next(err);
  }
};

export const addTaskComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    const task = await Task.findOne({ _id: taskId, businessId: req.business._id });
    if (!task) {
      return sendError(res, 'Task not found.', 404, 'NOT_FOUND');
    }

    const comment = await TaskComment.create({
      businessId: req.business._id,
      taskId: task._id,
      content,
      authorId: req.user._id,
    });

    const populated = await TaskComment.findById(comment._id).populate('authorId', 'name email avatarUrl');
    return sendSuccess(res, populated, 'Comment added.', 201);
  } catch (err) {
    next(err);
  }
};
