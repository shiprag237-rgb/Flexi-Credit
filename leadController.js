import { Lead } from '../models/Lead.js';
import { Customer } from '../models/Customer.js';
import { LeadActivity } from '../models/LeadActivity.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { recordAuditLog } from '../services/auditService.js';

export const listLeads = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      stage,
      source,
      assignedTo,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { businessId: req.business._id };

    if (stage) filter.stage = stage;
    if (source) filter.source = source;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('assignedTo', 'name email avatarUrl')
        .populate('campaignId', 'name channel')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Lead.countDocuments(filter),
    ]);

    return sendSuccess(res, leads, null, 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

export const createLead = async (req, res, next) => {
  try {
    const lead = await Lead.create({
      ...req.body,
      businessId: req.business._id,
      createdBy: req.user._id,
    });

    await LeadActivity.create({
      businessId: req.business._id,
      leadId: lead._id,
      type: 'note',
      title: 'Lead Created',
      description: `Opportunity added to pipeline at stage: ${lead.stage}`,
      performedBy: req.user._id,
    });

    await recordAuditLog({
      businessId: req.business._id,
      actorUserId: req.user._id,
      action: 'lead.created',
      resourceType: 'lead',
      resourceId: lead._id,
      metadata: { name: lead.name, stage: lead.stage },
      req,
    });

    return sendSuccess(res, lead, 'Lead created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

export const getLead = async (req, res, next) => {
  try {
    const { leadId } = req.params;

    const lead = await Lead.findOne({ _id: leadId, businessId: req.business._id })
      .populate('assignedTo', 'name email avatarUrl')
      .populate('campaignId', 'name channel')
      .populate('convertedCustomerId', 'name companyName email');

    if (!lead) {
      return sendError(res, 'Lead not found.', 404, 'NOT_FOUND');
    }

    const activities = await LeadActivity.find({
      businessId: req.business._id,
      leadId: lead._id,
    })
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, {
      ...lead.toObject(),
      activities,
    });
  } catch (err) {
    next(err);
  }
};

export const updateLead = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const lead = await Lead.findOne({ _id: leadId, businessId: req.business._id });

    if (!lead) {
      return sendError(res, 'Lead not found.', 404, 'NOT_FOUND');
    }

    const previousStage = lead.stage;
    Object.assign(lead, req.body);
    await lead.save();

    if (req.body.stage && req.body.stage !== previousStage) {
      await LeadActivity.create({
        businessId: req.business._id,
        leadId: lead._id,
        type: 'stage_change',
        title: 'Stage Changed',
        description: `Stage moved from "${previousStage}" to "${lead.stage}"`,
        performedBy: req.user._id,
      });
    }

    return sendSuccess(res, lead, 'Lead updated successfully.');
  } catch (err) {
    next(err);
  }
};

export const convertLead = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const lead = await Lead.findOne({ _id: leadId, businessId: req.business._id });

    if (!lead) {
      return sendError(res, 'Lead not found.', 404, 'NOT_FOUND');
    }

    if (lead.convertedCustomerId) {
      return sendError(res, 'This lead has already been converted into a customer.', 400, 'ALREADY_CONVERTED');
    }

    // Deduplication check: see if a customer already exists with this email or exact name/company in this workspace
    let customer = null;
    if (lead.email) {
      customer = await Customer.findOne({
        businessId: req.business._id,
        email: lead.email.toLowerCase(),
      });
    }

    if (!customer) {
      customer = await Customer.create({
        businessId: req.business._id,
        name: req.body.customerName || lead.name,
        companyName: req.body.companyName || lead.companyName,
        email: req.body.email || lead.email,
        phone: req.body.phone || lead.phone,
        status: 'active',
        source: `Converted Lead (${lead.source})`,
        notes: `Converted from lead opportunity. ${req.body.notes || lead.notes || ''}`.trim(),
        createdBy: req.user._id,
      });
    }

    // Mark lead as converted and stage 'won'
    lead.stage = 'won';
    lead.convertedCustomerId = customer._id;
    await lead.save();

    await LeadActivity.create({
      businessId: req.business._id,
      leadId: lead._id,
      type: 'stage_change',
      title: 'Converted to Customer',
      description: `Lead converted to customer: ${customer.name} (${customer.companyName || 'Individual'})`,
      performedBy: req.user._id,
    });

    await recordAuditLog({
      businessId: req.business._id,
      actorUserId: req.user._id,
      action: 'lead.converted',
      resourceType: 'lead',
      resourceId: lead._id,
      metadata: { customerId: customer._id },
      req,
    });

    return sendSuccess(res, { lead, customer }, 'Lead successfully converted to customer.');
  } catch (err) {
    next(err);
  }
};

export const addLeadActivity = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const { type, title, description } = req.body;

    const lead = await Lead.findOne({ _id: leadId, businessId: req.business._id });
    if (!lead) {
      return sendError(res, 'Lead not found.', 404, 'NOT_FOUND');
    }

    const activity = await LeadActivity.create({
      businessId: req.business._id,
      leadId: lead._id,
      type: type || 'note',
      title,
      description: description || '',
      performedBy: req.user._id,
    });

    return sendSuccess(res, activity, 'Activity added.', 201);
  } catch (err) {
    next(err);
  }
};
