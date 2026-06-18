const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { success, created, notFound, validationError } = require('../utils/response');

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const register = async (req, res, next) => {
  try {
    const { username, password, name, email } = req.body;
    if (!username || !password || !name || !email) {
      return validationError(res, 'All fields are required: username, password, name, email.');
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      const field = existingUser.username === username ? 'username' : 'email';
      const { conflict } = require('../utils/response');
      return conflict(res, `This ${field} is already registered.`);
    }

    const user = await User.create({ username, password, name, email });
    const token = generateToken(user);
    return created(res, { token, user: user.toAuthJSON() }, 'Account created successfully.');
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return validationError(res, 'Username and password are required.');
    }

    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      const { unauthorized } = require('../utils/response');
      return unauthorized(res, 'Invalid username or password.');
    }
    if (!user.isActive) {
      const { forbidden } = require('../utils/response');
      return forbidden(res, 'Account has been blocked. Contact an administrator.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const { unauthorized } = require('../utils/response');
      return unauthorized(res, 'Invalid username or password.');
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    return success(res, { token, user: user.toAuthJSON() }, 'Login successful.');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('username name email role lastLogin');
    if (!user) return notFound(res, 'User not found.');
    return success(res, user.toAuthJSON(), 'Profile retrieved.');
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
