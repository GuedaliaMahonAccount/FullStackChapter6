/**
 * Global Error Handler Middleware
 * 
 * Catches all unhandled errors and returns a consistent JSON response.
 * Handles Mongoose-specific errors (validation, cast, duplicate key)
 * with descriptive messages.
 * 
 * Must be registered AFTER all routes in server.js.
 */
const errorHandler = (err, _req, res, _next) => {
  console.error('❌ Error:', err.message);

  // Mongoose validation error (e.g., required fields, enum mismatch)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      error: 'Validation failed.',
      details: messages,
    });
  }

  // Mongoose cast error (e.g., invalid ObjectId format)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: `Invalid ${err.path}: "${err.value}". Expected a valid ID.`,
    });
  }

  // MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      error: `Duplicate value for "${field}". This ${field} is already taken.`,
    });
  }

  // JWT errors are handled in auth middleware, but catch strays here
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token has expired.' });
  }

  // Default: internal server error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 500
      ? 'Internal server error.'
      : err.message,
  });
};

module.exports = errorHandler;
