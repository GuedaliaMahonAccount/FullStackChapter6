const { validationError, conflict, unauthorized, serverError } = require('../utils/response');

const errorHandler = (err, _req, res, _next) => {
  console.error('❌ Error:', err.message);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message).join(', ');
    return validationError(res, `Validation failed: ${messages}`);
  }

  // Mongoose CastError for invalid ObjectId format.
  if (err.name === 'CastError') {
    return validationError(res, `Invalid ${err.path}: "${err.value}". Expected a valid ID.`);
  }

  // Exsisting unique field value (e.g. username, email) violates unique index constraint.
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return conflict(res, `Duplicate value for "${field}". This ${field} is already taken.`);
  }

  // Token errors from auth middleware
  if (err.name === 'JsonWebTokenError') return unauthorized(res, 'Invalid token.');
  if (err.name === 'TokenExpiredError') return unauthorized(res, 'Token has expired.');

  // Hide internal details for unexpected errors, but use the provided message for known errors with a statusCode.
  return serverError(res, err.statusCode === 500 || !err.statusCode
    ? 'Internal server error.'
    : err.message);
};

module.exports = errorHandler;
