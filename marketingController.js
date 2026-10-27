import { MarketingCampaign } from '../models/MarketingCampaign.js';
import { Lead } from '../models/Lead.js';
import { sendSuccess, sendError } from '../utils/responseFormatter.js';
import { recordAuditLog } from '../services/auditService.js';

export const listCampaigns = async (req, res, next) => {
  try {
    const { status, channel, search = '' } = req.query;
    const filter = { businessId: req.business._id };

    if (status) filter.status = status;
    if (channel) filter.channel = channel;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const campaigns = await MarketingCampaign.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Query actual attributed leads for each campaign dynamically
    const campaignIds = campaigns.map((c) => c._id);
    const leadStats = await Lead.aggregate([
      {
        $match: {
          businessId: req.business._id,
          campaignId: { $in: campaignIds },
        },
      },
      {
        $group: {
          _id: '$campaignId',
          leadsCount: { $sum: 1 },
          conversions: {
            $sum: { $cond: [{ $eq: ['$stage', 'won'] }, 1, 0] },
          },
          totalEstimatedValueMinor: { $sum: '$estimatedValueMinor' },
        },
      },
    ]);

    const leadStatMap = {};
    leadStats.forEach((s) => {
      leadStatMap[s._id.toString()] = s;
    });

    const enrichedCampaigns = campaigns.map((c) => {
      const stats = leadStatMap[c._id.toString()] || { leadsCount: 0, conversions: 0, totalEstimatedValueMinor: 0 };
      const budget = c.budgetMinor / 100;
      const spent = c.spentMinor / 100;
      const attributedPipeline = stats.totalEstimatedValueMinor / 100;

      return {
        ...c,
        leadsGenerated: stats.leadsCount,
        conversions: stats.conversions,
        attributedPipelineValue: attributedPipeline,
        roiPercentage: spent > 0 ? Math.round(((attributedPipeline - spent) / spent) * 100) : 0,
      };
    });

    return sendSuccess(res, enrichedCampaigns);
  } catch (err) {
    next(err);
  }
};

export const createCampaign = async (req, res, next) => {
  try {
    const campaign = await MarketingCampaign.create({
      ...req.body,
      businessId: req.business._id,
      createdBy: req.user._id,
    });

    await recordAuditLog({
      businessId: req.business._id,
      actorUserId: req.user._id,
      action: 'campaign.created',
      resourceType: 'campaign',
      resourceId: campaign._id,
      metadata: { name: campaign.name, channel: campaign.channel },
      req,
    });

    return sendSuccess(res, campaign, 'Marketing campaign created.', 201);
  } catch (err) {
    next(err);
  }
};

export const getCampaign = async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const campaign = await MarketingCampaign.findOne({ _id: campaignId, businessId: req.business._id });

    if (!campaign) {
      return sendError(res, 'Campaign not found.', 404, 'NOT_FOUND');
    }

    const attributedLeads = await Lead.find({ businessId: req.business._id, campaignId })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, {
      ...campaign.toObject(),
      attributedLeads,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCampaign = async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const campaign = await MarketingCampaign.findOneAndUpdate(
      { _id: campaignId, businessId: req.business._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!campaign) {
      return sendError(res, 'Campaign not found.', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, campaign, 'Campaign updated successfully.');
  } catch (err) {
    next(err);
  }
};

export const deleteCampaign = async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const campaign = await MarketingCampaign.findOneAndDelete({
      _id: campaignId,
      businessId: req.business._id,
    });

    if (!campaign) {
      return sendError(res, 'Campaign not found.', 404, 'NOT_FOUND');
    }

    // Unlink campaign from leads
    await Lead.updateMany({ businessId: req.business._id, campaignId }, { $unset: { campaignId: 1 } });

    return sendSuccess(res, null, 'Campaign deleted successfully.');
  } catch (err) {
    next(err);
  }
};
