/**
 * Server-side in-memory cache.
 *
 * Security:
 * - Cache is consulted ONLY after auth middleware verifies the user.
 * - Keys are scoped to userId, so no cross-user leakage.
 * - All HTTP responses carry Cache-Control: no-store — browsers never store anything.
 * - Blocked users are rejected by auth before the cache is ever hit.
 *
 * Key format: `${userId}::${absolutePath}::${sortedQueryString}`
 * Using req.originalUrl (absolute) avoids collisions between routers that
 * would otherwise share the same relative req.path (e.g. both /todos and
 * /albums mount handlers at GET / inside their own routers).
 */

const store = new Map();
const DEFAULT_TTL_MS = 20_000; // 20 seconds

const buildKey = (userId, originalUrl, query) => {
  const path = originalUrl.split('?')[0];
  const qs = JSON.stringify(Object.keys(query).sort().reduce((acc, k) => { acc[k] = query[k]; return acc; }, {}));
  return `${userId}::${path}::${qs}`;
};

/**
 * Express cache middleware factory.
 * Must be placed AFTER the `auth` middleware so req.user is available.
 */
const cache = (ttlMs = DEFAULT_TTL_MS) => (req, res, next) => {
  if (req.method !== 'GET') return next();

  const key = buildKey(req.user.id, req.originalUrl, req.query);
  const entry = store.get(key);

  if (entry && Date.now() - entry.ts < ttlMs) {
    return res.json(entry.data);
  }

  // Override res.json to save successful responses before sending to client.
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      store.set(key, { data, ts: Date.now() });
    }
    return originalJson(data);
  };

  next();
};

/**
 * Invalidate all cache entries for a specific user.
 * Use for user-scoped resources (todos).
 */
const invalidate = (userId) => {
  for (const key of store.keys()) {
    if (key.startsWith(`${userId}::`)) store.delete(key);
  }
};

/**
 * Invalidate ALL users' cache entries whose URL starts with pathPrefix.
 * Use for shared resources (posts, albums).
 */
const invalidatePath = (pathPrefix) => {
  for (const key of store.keys()) {
    const parts = key.split('::');
    if (parts[1] && parts[1].startsWith(pathPrefix)) store.delete(key);
  }
};

module.exports = { cache, invalidate, invalidatePath };
