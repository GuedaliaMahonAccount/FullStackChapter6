const mongoose = require('mongoose');

/**
 * Post Schema
 * 
 * Represents a blog post created by a user.
 * Supports soft deletion via the `isDeleted` flag.
 */
const postSchema = new mongoose.Schema(
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
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    body: {
      type: String,
      required: [true, 'Body is required'],
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

/**
 * Index for efficient querying: fetch posts by user, excluding deleted ones.
 */
postSchema.index({ userId: 1, isDeleted: 1 });

/**
 * Transform: strip __v from JSON output.
 */
postSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = doc._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.isDeleted;
    return ret;
  },
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
