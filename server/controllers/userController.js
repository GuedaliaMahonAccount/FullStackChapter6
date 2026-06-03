const User = require('../models/User');

/**
 * GET /users
 * List all active users. Admin only.
 * 
 * Query params: ?role=admin|user
 */
const getUsers = async (req, res, next) => {
  try {
    const filter = {};

    // Optional role filter
    if (req.query.role && ['admin', 'user'].includes(req.query.role)) {
      filter.role = req.query.role;
    }

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /users/:id
 * Get a single user by ID.
 * Accessible by the user themselves or an admin.
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Only self or admin can view full details
    if (req.user.id !== user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied. You can only view your own profile.',
      });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /users/:id
 * Update user profile (name, email).
 * Accessible by the user themselves or an admin.
 */
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role } = req.body;

    // Only self or admin can update
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied. You can only update your own profile.',
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    // Only admins can change roles
    if (role && req.user.role === 'admin') {
      updateData.role = role;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /users/:id/password
 * Change user password. Self only.
 * 
 * Body: { currentPassword, newPassword }
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Only self can change their own password
    if (req.user.id !== req.params.id) {
      return res.status(403).json({
        error: 'Access denied. You can only change your own password.',
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Both currentPassword and newPassword are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'New password must be at least 6 characters.',
      });
    }

    // Fetch user with password field
    const user = await User.findById(req.params.id).select('+password');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /users/:id/block
 * Toggle user's isActive status. Admin only.
 */
const toggleBlockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Prevent admin from blocking themselves
    if (req.user.id === user._id.toString()) {
      return res.status(400).json({
        error: 'You cannot block your own account.',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User "${user.username}" has been ${user.isActive ? 'unblocked' : 'blocked'}.`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  changePassword,
  toggleBlockUser,
};
