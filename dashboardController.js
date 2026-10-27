import { getDashboardSummary } from '../services/analyticsService.js';
import { sendSuccess } from '../utils/responseFormatter.js';

export const getSummary = async (req, res, next) => {
  try {
    const { timeframe = '30d', startDate, endDate } = req.query;
    const summary = await getDashboardSummary(req.business._id, timeframe, startDate, endDate);
    return sendSuccess(res, summary);
  } catch (err) {
    next(err);
  }
};
