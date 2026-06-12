const ActivityLog = require('../models/ActivityLog');

const logActivity = (userId, action, resourceType, resourceId, resourceTitle = '') => {
  ActivityLog.create({ userId, action, resourceType, resourceId, resourceTitle: String(resourceTitle).slice(0, 120) })
    .catch(() => {}); // fire-and-forget — never delay the response
};

module.exports = logActivity;
