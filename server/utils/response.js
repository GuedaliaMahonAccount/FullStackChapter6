/**
 * Standardized API envelope builder.
 *
 * Every response the server sends follows the same shape:
 *   { status: string, message: string, data: object|array|null }
 *
 * Defined statuses:
 *   SUCCESS          – data found / action completed with a payload
 *   CREATED          – resource created (HTTP 201)
 *   UPDATED          – resource updated in-place
 *   DELETED          – resource soft/hard deleted (no payload)
 *   NO_DATA          – query ran fine but returned 0 records (NOT an error)
 *   NOT_FOUND        – specific resource does not exist (HTTP 404)
 *   UNAUTHORIZED     – request lacks valid credentials (HTTP 401)
 *   FORBIDDEN        – authenticated but lacks permission (HTTP 403)
 *   VALIDATION_ERROR – client sent malformed/incomplete input (HTTP 400)
 *   CONFLICT         – duplicate key / business rule violation (HTTP 409)
 *   SERVER_ERROR     – unhandled server exception (HTTP 500)
 */

const send = (res, httpCode, status, message, data = null) =>
  res.status(httpCode).json({ status, message, data });

module.exports = {
  success:         (res, data, message = 'Request successful.')                    => send(res, 200, 'SUCCESS',          message, data),
  created:         (res, data, message = 'Resource created.')                      => send(res, 201, 'CREATED',          message, data),
  updated:         (res, data, message = 'Resource updated.')                      => send(res, 200, 'UPDATED',          message, data),
  deleted:         (res, message = 'Resource deleted.')                            => send(res, 200, 'DELETED',          message, null),
  noData:          (res, message = 'No records found.')                            => send(res, 200, 'NO_DATA',          message, null),
  notFound:        (res, message = 'Resource not found.')                          => send(res, 404, 'NOT_FOUND',        message, null),
  unauthorized:    (res, message = 'Authentication required.')                     => send(res, 401, 'UNAUTHORIZED',     message, null),
  forbidden:       (res, message = 'Access denied.')                               => send(res, 403, 'FORBIDDEN',        message, null),
  validationError: (res, message = 'Validation failed.')                           => send(res, 400, 'VALIDATION_ERROR', message, null),
  conflict:        (res, message = 'Resource already exists.')                     => send(res, 409, 'CONFLICT',         message, null),
  serverError:     (res, message = 'Internal server error.')                       => send(res, 500, 'SERVER_ERROR',     message, null),
};
