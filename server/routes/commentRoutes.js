const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { checkOwnership } = require('../middleware/ownership');
const Comment = require('../models/Comment');
const {
  getComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
} = require('../controllers/commentController');

/**
 * Comment Routes
 * 
 * All routes require authentication.
 * Supports query filtering like jsonplaceholder: /comments?postId=<id>
 * 
 * GET    /comments        — Get all comments (?postId=<id>)
 * GET    /comments/:id    — Get single comment
 * POST   /comments        — Create a comment (postId in body)
 * PUT    /comments/:id    — Update comment (owner or admin)
 * DELETE /comments/:id    — Soft delete comment (owner or admin)
 */

router.get('/', auth, getComments);
router.get('/:id', auth, getCommentById);
router.post('/', auth, createComment);
router.put('/:id', auth, checkOwnership(Comment), updateComment);
router.delete('/:id', auth, checkOwnership(Comment), deleteComment);

module.exports = router;
