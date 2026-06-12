const { validationError, conflict, unauthorized, serverError } = require('../utils/response');

const errorHandler = (err, _req, res, _next) => {
  console.error('❌ Error:', err.message);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message).join(', ');
    return validationError(res, `Validation failed: ${messages}`);
  }

  if (err.name === 'CastError') {
    return validationError(res, `Invalid ${err.path}: "${err.value}". Expected a valid ID.`);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return conflict(res, `Duplicate value for "${field}". This ${field} is already taken.`);
  }

  if (err.name === 'JsonWebTokenError') return unauthorized(res, 'Invalid token.');
  if (err.name === 'TokenExpiredError') return unauthorized(res, 'Token has expired.');

  return serverError(res, err.statusCode === 500 || !err.statusCode
    ? 'Internal server error.'
    : err.message);
};

module.exports = errorHandler;
