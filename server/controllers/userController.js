const User = require('../models/User');
const { success, updated, deleted, noData, notFound, forbidden, validationError, unauthorized } = require('../utils/response');

const getUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role && ['admin', 'user'].includes(req.query.role)) filter.role = req.query.role;

    const users = await User.find(filter).sort({ createdAt: -1 });
    if (users.length === 0) return noData(res, 'No users found.');
    return success(res, users, `${users.length} user(s) found.`);
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return notFound(res, 'User not found.');

    if (req.user.id !== user._id.toString() && req.user.role !== 'admin') {
      return forbidden(res, 'Access denied. You can only view your own profile.');
    }
    return success(res, user, 'User retrieved.');
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return forbidden(res, 'Access denied. You can only update your own profile.');
    }

    const { name, email, role, pageSize } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (req.user.role === 'admin') {
      if (role && ['admin', 'user'].includes(role)) updateData.role = role;
      if (pageSize !== undefined) updateData.pageSize = pageSize;
    }

    if (Object.keys(updateData).length === 0) {
      const user = await User.findById(req.params.id);
      if (!user) return notFound(res, 'User not found.');
      return updated(res, user, 'No changes detected.');
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!user) return notFound(res, 'User not found.');
    return updated(res, user, 'User updated successfully.');
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id) {
      return forbidden(res, 'Access denied. You can only change your own password.');
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return validationError(res, 'Both currentPassword and newPassword are required.');
    }
    if (newPassword.length < 6) {
      return validationError(res, 'New password must be at least 6 characters.');
    }

    const user = await User.findById(req.params.id).select('+password');
    if (!user) return notFound(res, 'User not found.');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return unauthorized(res, 'Current password is incorrect.');

    user.password = newPassword;
    await user.save();
    return updated(res, null, 'Password updated successfully.');
  } catch (error) {
    next(error);
  }
};

const toggleBlockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return notFound(res, 'User not found.');

    if (req.user.id === user._id.toString()) {
      return validationError(res, 'You cannot block your own account.');
    }

    user.isActive = !user.isActive;
    await user.save();
    return updated(res, user, `User "${user.username}" has been ${user.isActive ? 'unblocked' : 'blocked'}.`);
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUserById, updateUser, changePassword, toggleBlockUser };
