const mongoose = require('mongoose');

/**
 * Todo Schema
 * 
 * Represents a todo item belonging to a specific user.
 * Supports soft deletion via the `isDeleted` flag.
 */
const todoSchema = new mongoose.Schema(
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
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    completed: {
      type: Boolean,
      default: false,
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
 * Index for efficient querying: fetch todos by user, excluding deleted ones.
 */
todoSchema.index({ userId: 1, isDeleted: 1 });

/**
 * Transform: strip __v from JSON output.
 */
todoSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = doc._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.isDeleted;
    return ret;
  },
});

const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo;
