const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { checkOwnership } = require('../middleware/ownership');
const { cache } = require('../middleware/cache');
const Post = require('../models/Post');
const {
  getPosts,
  getPostById,
  getPostComments,
  createPost,
  updatePost,
  deletePost,
} = require('../controllers/postController');

/**
 * Post Routes
 * 
 * All routes require authentication.
 * Replicates jsonplaceholder routing style including nested comments.
 * 
 * GET    /posts              — Get all posts (?userId=<id>)
 * GET    /posts/:id          — Get single post
 * GET    /posts/:id/comments — Get comments for a post
 * POST   /posts              — Create a new post
 * PUT    /posts/:id          — Update post (owner or admin)
 * DELETE /posts/:id          — Soft delete post (owner or admin)
 */

router.get('/', auth, cache(20_000), getPosts);
router.get('/:id', auth, cache(20_000), getPostById);
router.get('/:id/comments', auth, cache(20_000), getPostComments);
router.post('/', auth, createPost);
router.put('/:id', auth, checkOwnership(Post), updatePost);
router.delete('/:id', auth, checkOwnership(Post), deletePost);

module.exports = router;
