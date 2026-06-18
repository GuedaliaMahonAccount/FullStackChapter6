const ActivityLog = require('../models/ActivityLog');

const logActivity = (userId, action, resourceType, resourceId, resourceTitle = '') => {
  // The log not in await to avoid slowing down the main request. If logging fails, we just ignore it.
  ActivityLog.create({ userId, action, resourceType, resourceId, resourceTitle: String(resourceTitle).slice(0, 120) })
    .catch(() => {}); // fire-and-forget — never delay the response.
};

module.exports = logActivity;
