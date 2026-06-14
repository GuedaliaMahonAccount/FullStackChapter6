/**
 * Client-side in-memory query cache.
 *
 * Avoids redundant API calls when a user navigates back to a page they already
 * visited in the same session (e.g. Todos → Posts → Todos again).
 *
 * Security: this cache lives only in JS memory (not localStorage / sessionStorage /
 * IndexedDB), so it is cleared on page refresh and is never accessible via URL or
 * browser storage inspector.
 */

const store = new Map();
const DEFAULT_TTL = 30_000; // 30 s

/**
 * Return cached data for key, or null if absent / expired.
 */
export function getCached(key) {
  const entry = store.get(key);
  if (entry && Date.now() - entry.ts < DEFAULT_TTL) return entry.data;
  store.delete(key); // clean up stale entry
  return null;
}

/**
 * Store data under key.
 */
export function setCached(key, data) {
  store.set(key, { data, ts: Date.now() });
}

/**
 * Remove all cache entries whose key starts with prefix order to invalidate related queries and routes at once (e.g. all /todos/posts queries after creating/updating/deleting).
 */
export function invalidatePrefix(prefix) {
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}

/**
 * Remove a specific key.
 */
export function invalidateKey(key) {
  store.delete(key);
}
