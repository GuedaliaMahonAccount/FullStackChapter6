const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const {
  getUsers,
  getUserById,
  updateUser,
  changePassword,
  toggleBlockUser,
} = require('../controllers/userController');

/**
 * User Routes
 * 
 * All routes require authentication.
 * 
 * GET    /users              — List all users (admin only)
 * GET    /users/:id          — Get user by ID (self or admin)
 * PUT    /users/:id          — Update user profile (self or admin)
 * PUT    /users/:id/password — Change password (self only)
 * PATCH  /users/:id/block    — Toggle isActive (admin only)
 */

router.get('/', auth, adminOnly, getUsers);
router.get('/:id', auth, getUserById);
router.put('/:id', auth, updateUser);
router.put('/:id/password', auth, changePassword);
router.patch('/:id/block', auth, adminOnly, toggleBlockUser);

module.exports = router;
