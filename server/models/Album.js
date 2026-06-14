const mongoose = require('mongoose');

/**
 * Album Schema (Stub)
 * 
 * Prepared for future implementation.
 * Represents a photo album belonging to a user.
 */
const albumSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

albumSchema.index({ userId: 1, isDeleted: 1 });

albumSchema.set('toJSON', {
  transform: (_doc, ret) => {
    // Delete the version key to hide internal details
    delete ret.__v;
    return ret;
  },
});

const Album = mongoose.model('Album', albumSchema);

module.exports = Album;
