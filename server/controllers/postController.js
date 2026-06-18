const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { success, created, updated, deleted, noData, notFound, validationError } = require('../utils/response');
const { invalidate, invalidatePath } = require('../middleware/cache');
const logActivity = require('../services/activityLogger');

const getPosts = async (req, res, next) => {
  try {
    const filter = { isDeleted: false };
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.mine === 'true') filter.userId = req.user.id;
    if (req.query.title) filter.title = { $regex: req.query.title, $options: 'i' };
    if (req.query._id) filter._id = req.query._id;

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 12));
    const skip  = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find(filter).populate('userId', 'username name').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments(filter),
    ]);

    if (total === 0) return noData(res, 'No posts found.');
    return success(res, { posts, total, page, limit, hasMore: skip + posts.length < total }, `${total} post(s) found.`);
  } catch (error) {
    next(error);
  }
};

const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false }).populate('userId', 'username name');
    if (!post) return notFound(res, 'Post not found.');
    return success(res, post, 'Post retrieved.');
  } catch (error) {
    next(error);
  }
};

const getPostComments = async (req, res, next) => {
  try {
    const [post, comments] = await Promise.all([
      Post.findOne({ _id: req.params.id, isDeleted: false }).select('_id'),
      Comment.find({ postId: req.params.id, isDeleted: false }).populate('userId', 'username name').sort({ createdAt: 1 }),
    ]);
    if (!post) return notFound(res, 'Post not found.');
    if (comments.length === 0) return noData(res, 'No comments on this post yet.');
    return success(res, comments, `${comments.length} comment(s) found.`);
  } catch (error) {
    next(error);
  }
};

const getUserPosts = async (req, res, next) => {
  try {
    const filter = { userId: req.params.userId, isDeleted: false };
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 12));
    const skip  = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find(filter).populate('userId', 'username name').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments(filter),
    ]);

    if (total === 0) return noData(res, 'No posts found for this user.');
    return success(res, { posts, total, page, limit, hasMore: skip + posts.length < total }, `${total} post(s) found.`);
  } catch (error) {
    next(error);
  }
};

const createPost = async (req, res, next) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) return validationError(res, 'Title and body are required.');

    const post = await Post.create({ userId: req.user.id, title, body });
    await post.populate('userId', 'username name');
    invalidatePath('/posts');
    await User.findByIdAndUpdate(req.user.id, { $set: { lastActivityAt: new Date() } });
    logActivity(req.user.id, 'CREATE', 'post', post._id, post.title);
    return created(res, post, 'Post created.');
  } catch (error) {
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const post = req.resource;
    const { title, body } = req.body;
    if (title !== undefined) post.title = title;
    if (body !== undefined) post.body = body;
    await post.save();
    await post.populate('userId', 'username name');
    invalidatePath('/posts');
    await User.findByIdAndUpdate(req.user.id, { $set: { lastActivityAt: new Date() } });
    logActivity(req.user.id, 'UPDATE', 'post', post._id, post.title);
    return updated(res, post, 'Post updated.');
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const post = req.resource;
    const { title: postTitle, _id: postId } = post;
    await Comment.updateMany({ postId: post._id, isDeleted: false }, { $set: { isDeleted: true } });
    post.isDeleted = true;
    await post.save();
    invalidatePath('/posts');
    invalidatePath('/comments');
    await User.findByIdAndUpdate(req.user.id, { $set: { lastActivityAt: new Date() } });
    logActivity(req.user.id, 'DELETE', 'post', postId, postTitle);
    return deleted(res, 'Post and its comments deleted.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getPosts, getPostById, getPostComments, getUserPosts, createPost, updatePost, deletePost };
