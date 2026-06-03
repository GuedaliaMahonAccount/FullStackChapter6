const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate a JWT for the given user.
 * @param {Object} user - Mongoose user document.
 * @returns {string} Signed JWT token.
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * POST /auth/register
 * Register a new user account.
 * 
 * Body: { username, password, name, email }
 * Returns: { token, user }
 */
const register = async (req, res, next) => {
  try {
    const { username, password, name, email } = req.body;

    // Check required fields
    if (!username || !password || !name || !email) {
      return res.status(400).json({
        error: 'All fields are required: username, password, name, email.',
      });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      const field = existingUser.username === username ? 'username' : 'email';
      return res.status(409).json({
        error: `This ${field} is already registered.`,
      });
    }

    // Create user (password hashed by pre-save hook)
    const user = await User.create({ username, password, name, email });
    const token = generateToken(user);

    res.status(201).json({ token, user });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/login
 * Authenticate a user and return a JWT.
 * 
 * Body: { username, password }
 * Returns: { token, user }
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required.',
      });
    }

    // Find user by username (need password for comparison)
    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      return res.status(401).json({
        error: 'Invalid username or password.',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account has been blocked. Contact an administrator.',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid username or password.',
      });
    }

    const token = generateToken(user);

    res.json({ token, user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };
