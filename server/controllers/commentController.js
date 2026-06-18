const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const { success, created, updated, deleted, noData, notFound, validationError } = require('../utils/response');
const { invalidatePath } = require('../middleware/cache');
const logActivity = require('../services/activityLogger');

const getComments = async (req, res, next) => {
  try {
    const filter = { isDeleted: false };
    if (req.query.postId) filter.postId = req.query.postId;

    const comments = await Comment.find(filter).populate('userId', 'username name').sort({ createdAt: 1 });
    if (comments.length === 0) return noData(res, 'No comments found.');
    return success(res, comments, `${comments.length} comment(s) found.`);
  } catch (error) {
    next(error);
  }
};

const getCommentById = async (req, res, next) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.id, isDeleted: false }).populate('userId', 'username name');
    if (!comment) return notFound(res, 'Comment not found.');
    return success(res, comment, 'Comment retrieved.');
  } catch (error) {
    next(error);
  }
};

const createComment = async (req, res, next) => {
  try {
    const { postId, body, name, email } = req.body;
    if (!postId || !body) return validationError(res, 'postId and body are required.');

    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post) return notFound(res, 'Post not found.');

    const comment = await Comment.create({
      postId,
      userId: req.user.id,
      name: name || req.user.username,
      email: email || '',
      body,
    });
    await comment.populate('userId', 'username name');
    invalidatePath('/posts');
    await User.findByIdAndUpdate(req.user.id, { $set: { lastActivityAt: new Date() } });
    logActivity(req.user.id, 'CREATE', 'comment', comment._id, comment.body);
    return created(res, comment, 'Comment added.');
  } catch (error) {
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const comment = req.resource;
    const { body, name } = req.body;
    if (body !== undefined) comment.body = body;
    if (name !== undefined) comment.name = name;
    await comment.save();
    await comment.populate('userId', 'username name');
    invalidatePath('/posts');
    await User.findByIdAndUpdate(req.user.id, { $set: { lastActivityAt: new Date() } });
    logActivity(req.user.id, 'UPDATE', 'comment', comment._id, comment.body);
    return updated(res, comment, 'Comment updated.');
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const comment = req.resource;
    const { body: commentBody, _id: commentId } = comment;
    comment.isDeleted = true;
    await comment.save();
    invalidatePath('/posts');
    await User.findByIdAndUpdate(req.user.id, { $set: { lastActivityAt: new Date() } });
    logActivity(req.user.id, 'DELETE', 'comment', commentId, commentBody);
    return deleted(res, 'Comment deleted.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getComments, getCommentById, createComment, updateComment, deleteComment };
