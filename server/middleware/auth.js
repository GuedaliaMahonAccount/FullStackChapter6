const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware
 * 
 * Verifies the JWT from the Authorization header.
 * Attaches `req.user` with { id, username, role } on success.
 * Also checks that the user account is still active (not blocked).
 * 
 * Usage: router.get('/protected', auth, controller)
 */
const auth = async (req, res, next) => {
  try {
    // Extract token from "Bearer <token>" header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check that the user still exists and is active
    const user = await User.findById(decoded.id).select('username role isActive');

    if (!user) {
      return res.status(401).json({
        error: 'Invalid token. User no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account has been blocked. Contact an administrator.',
      });
    }

    // Attach user info to request
    req.user = {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please log in again.' });
    }
    next(error);
  }
};

/**
 * Admin-only Middleware
 * 
 * Must be used AFTER the `auth` middleware.
 * Checks that `req.user.role === 'admin'`.
 */
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied. Admin privileges required.',
    });
  }
  next();
};

module.exports = { auth, adminOnly };
