const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action:        { type: String, enum: ['CREATE', 'UPDATE', 'DELETE'], required: true },
  resourceType:  { type: String, enum: ['todo', 'post', 'comment', 'album', 'photo'], required: true },
  resourceId:    { type: mongoose.Schema.Types.ObjectId },
  resourceTitle: { type: String, default: '' },
  timestamp:     { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 }, // auto-delete after 30 days
}, { timestamps: false });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
