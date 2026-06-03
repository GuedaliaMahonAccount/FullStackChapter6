const Comment = require('../models/Comment');
const Post = require('../models/Post');

/**
 * GET /comments
 * Get all non-deleted comments.
 * 
 * Query params: ?postId=<id>
 */
const getComments = async (req, res, next) => {
  try {
    const filter = { isDeleted: false };

    // Optional postId filter (replicates jsonplaceholder: /comments?postId=1)
    if (req.query.postId) {
      filter.postId = req.query.postId;
    }

    const comments = await Comment.find(filter)
      .populate('userId', 'username name')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /comments/:id
 * Get a single comment by ID.
 */
const getCommentById = async (req, res, next) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate('userId', 'username name');

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    res.json(comment);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /comments
 * Create a new comment on a post.
 * userId is set from the authenticated user's token.
 * name and email are auto-filled from the user if not provided.
 * 
 * Body: { postId, body, name?, email? }
 */
const createComment = async (req, res, next) => {
  try {
    const { postId, body, name, email } = req.body;

    if (!postId || !body) {
      return res.status(400).json({
        error: 'postId and body are required.',
      });
    }

    // Verify the post exists and is not deleted
    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const comment = await Comment.create({
      postId,
      userId: req.user.id,
      name: name || req.user.username,
      email: email || '',
      body,
    });

    await comment.populate('userId', 'username name');

    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /comments/:id
 * Update a comment's body.
 * Owner only (or admin). Uses req.resource from ownership middleware.
 * 
 * Body: { body?, name? }
 */
const updateComment = async (req, res, next) => {
  try {
    const comment = req.resource;
    const { body, name } = req.body;

    if (body !== undefined) comment.body = body;
    if (name !== undefined) comment.name = name;

    await comment.save();
    await comment.populate('userId', 'username name');

    res.json(comment);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /comments/:id
 * Soft-delete a comment (set isDeleted to true).
 * Owner only (or admin). Uses req.resource from ownership middleware.
 */
const deleteComment = async (req, res, next) => {
  try {
    const comment = req.resource;

    comment.isDeleted = true;
    await comment.save();

    res.json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
};
