const Post = require('../models/Post');
const Comment = require('../models/Comment');

/**
 * GET /posts
 * Get all non-deleted posts.
 * Populates userId with username and name for display.
 * 
 * Query params: ?userId=<id>
 */
const getPosts = async (req, res, next) => {
  try {
    const filter = { isDeleted: false };

    // Optional userId filter
    if (req.query.userId) {
      filter.userId = req.query.userId;
    }

    const posts = await Post.find(filter)
      .populate('userId', 'username name')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /posts/:id
 * Get a single post by ID.
 */
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate('userId', 'username name');

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    res.json(post);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /posts/:id/comments
 * Get all non-deleted comments for a specific post.
 * Optimized: fetches post existence + comments in parallel.
 */
const getPostComments = async (req, res, next) => {
  try {
    const [post, comments] = await Promise.all([
      Post.findOne({ _id: req.params.id, isDeleted: false }).select('_id'),
      Comment.find({ postId: req.params.id, isDeleted: false })
        .populate('userId', 'username name')
        .sort({ createdAt: 1 }),
    ]);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    res.json(comments);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /users/:userId/posts
 * Get all non-deleted posts by a specific user.
 */
const getUserPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({
      userId: req.params.userId,
      isDeleted: false,
    })
      .populate('userId', 'username name')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /posts
 * Create a new post for the authenticated user.
 * 
 * Body: { title, body }
 */
const createPost = async (req, res, next) => {
  try {
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        error: 'Title and body are required.',
      });
    }

    const post = await Post.create({
      userId: req.user.id,
      title,
      body,
    });

    // Populate the userId before returning
    await post.populate('userId', 'username name');

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /posts/:id
 * Update a post (title and/or body).
 * Owner only (or admin). Uses req.resource from ownership middleware.
 * 
 * Body: { title?, body? }
 */
const updatePost = async (req, res, next) => {
  try {
    const post = req.resource;
    const { title, body } = req.body;

    if (title !== undefined) post.title = title;
    if (body !== undefined) post.body = body;

    await post.save();
    await post.populate('userId', 'username name');

    res.json(post);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /posts/:id
 * Soft-delete a post (set isDeleted to true).
 * Owner only (or admin). Uses req.resource from ownership middleware.
 */
const deletePost = async (req, res, next) => {
  try {
    const post = req.resource;

    post.isDeleted = true;
    await post.save();

    res.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPosts,
  getPostById,
  getPostComments,
  getUserPosts,
  createPost,
  updatePost,
  deletePost,
};
