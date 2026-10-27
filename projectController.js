import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { recordAuditLog } from '../services/auditService.js';

export const listProjects = async (req, res, next) => {
  try {
    const { status, customerId, managerId, search = '', sortBy = 'createdAt', order = 'desc' } = req.query;

    const filter = { businessId: req.business._id };
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (managerId) filter.managerId = managerId;
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const sortOrder = order === 'asc' ? 1 : -1;

    const projects = await Project.find(filter)
      .populate('customerId', 'name companyName')
      .populate('managerId', 'name email avatarUrl')
      .populate('teamMemberIds', 'name email avatarUrl')
      .sort({ [sortBy]: sortOrder })
      .lean();

    return sendSuccess(res, projects);
  } catch (err) {
    next(err);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const project = await Project.create({
      ...req.body,
      businessId: req.business._id,
      createdBy: req.user._id,
    });

    await recordAuditLog({
      businessId: req.business._id,
      actorUserId: req.user._id,
      action: 'project.created',
      resourceType: 'project',
      resourceId: project._id,
      metadata: { name: project.name, budgetMinor: project.budgetMinor },
      req,
    });

    return sendSuccess(res, project, 'Project created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

export const getProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({ _id: projectId, businessId: req.business._id })
      .populate('customerId', 'name companyName email phone')
      .populate('managerId', 'name email avatarUrl')
      .populate('teamMemberIds', 'name email avatarUrl');

    if (!project) {
      return sendError(res, 'Project not found.', 404, 'NOT_FOUND');
    }

    const tasks = await Task.find({ businessId: req.business._id, projectId })
      .populate('assignedTo', 'name email avatarUrl')
      .sort({ dueDate: 1, createdAt: -1 });

    return sendSuccess(res, {
      ...project.toObject(),
      tasks,
    });
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOneAndUpdate(
      { _id: projectId, businessId: req.business._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!project) {
      return sendError(res, 'Project not found.', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, project, 'Project updated successfully.');
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOneAndDelete({
      _id: projectId,
      businessId: req.business._id,
    });

    if (!project) {
      return sendError(res, 'Project not found.', 404, 'NOT_FOUND');
    }

    // Cascade delete project tasks
    await Task.deleteMany({ businessId: req.business._id, projectId });

    return sendSuccess(res, null, 'Project and related tasks deleted successfully.');
  } catch (err) {
    next(err);
  }
};
