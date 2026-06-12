const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { unauthorized, forbidden } = require('../utils/response');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'Access denied. No token provided.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('username role isActive');
    if (!user) return unauthorized(res, 'Invalid token. User no longer exists.');
    if (!user.isActive) return forbidden(res, 'Account has been blocked. Contact an administrator.');

    req.user = { id: user._id.toString(), username: user.username, role: user.role };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') return unauthorized(res, 'Invalid token.');
    if (error.name === 'TokenExpiredError') return unauthorized(res, 'Token has expired. Please log in again.');
    next(error);
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return forbidden(res, 'Access denied. Admin privileges required.');
  }
  next();
};

module.exports = { auth, adminOnly };
