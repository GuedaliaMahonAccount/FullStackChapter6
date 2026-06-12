const ActivityLog = require('../models/ActivityLog');
const { success, noData, forbidden } = require('../utils/response');

const getActivity = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return forbidden(res, 'Admin access required.');

    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate('userId', 'username name')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      ActivityLog.countDocuments(filter),
    ]);

    if (total === 0) return noData(res, 'No activity logs found.');
    return success(res, { logs, total, page, limit, hasMore: skip + logs.length < total }, `${total} log(s) found.`);
  } catch (error) {
    next(error);
  }
};

module.exports = { getActivity };
