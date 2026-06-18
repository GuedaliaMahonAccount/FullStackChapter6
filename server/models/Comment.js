const mongoose = require('mongoose');

/**
 * Comment Schema
 * 
 * Represents a comment on a post.
 * Includes `userId` (not in original jsonplaceholder) to support
 * ownership validation for edit/delete operations.
 * Supports soft deletion via the `isDeleted` flag.
 */
const commentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Post ID is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    body: {
      type: String,
      required: [true, 'Comment body is required'],
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
 * Index for efficient querying: fetch comments by post, excluding deleted ones.
 */
commentSchema.index({ postId: 1, isDeleted: 1 });

/**
 * Transform: strip __v from JSON output.
 */
commentSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = doc._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.isDeleted;
    return ret;
  },
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
