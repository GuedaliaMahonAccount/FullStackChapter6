const mongoose = require('mongoose');

/**
 * Photo Schema (Stub)
 * 
 * Prepared for future implementation.
 * Represents a photo within an album.
 */
const photoSchema = new mongoose.Schema(
  {
    albumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Album',
      required: [true, 'Album ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'URL is required'],
    },
    thumbnailUrl: {
      type: String,
      required: [true, 'Thumbnail URL is required'],
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

photoSchema.index({ albumId: 1, isDeleted: 1 });

photoSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Photo = mongoose.model('Photo', photoSchema);

module.exports = Photo;
