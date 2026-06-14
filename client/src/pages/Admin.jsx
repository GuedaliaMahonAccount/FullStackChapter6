import { useState, useEffect, Fragment } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usersAPI, activityAPI } from '../api/api';
import Loader from '../components/Loader';
import '../styles/Admin.css';

const ACTION_BADGE = { CREATE: 'badge-success', UPDATE: 'badge-warning', DELETE: 'badge-danger' };
const RESOURCE_BADGE = { todo: 'badge-accent', post: 'badge-success', comment: 'badge-muted', album: 'badge-warning', photo: 'badge-danger' };

const timeAgo = (date) => {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return new Date(date).toLocaleDateString('he-IL', { dateStyle: 'short' });
};

const truncate = (str, n = 48) =>
  str && str.length > n ? str.slice(0, n) + '…' : str || '—';

const Admin = () => {
  const { user: currentUser, updateUserData } = useAuth();

  // ── Users ──────────────────────────────────────────────────────────────
  const [viewStatus, setViewStatus]       = useState('LOADING');
  const [users, setUsers]                 = useState([]);
  const [error, setError]                 = useState('');
  const [searchQuery, setSearchQuery]     = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [editingPageSize, setEditingPageSize] = useState(null);
  const [pageSizeInput, setPageSizeInput] = useState('');

  // ── Expandable rows ─────────────────────────────────────────────────────
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [userActivity, setUserActivity]     = useState({}); // keyed by userId

  // ── Global activity feed ────────────────────────────────────────────────
  const [feedStatus, setFeedStatus]       = useState('LOADING');
  const [activityLogs, setActivityLogs]   = useState([]);
  const [activityHasMore, setActivityHasMore] = useState(false);
  const [activityPage, setActivityPage]   = useState(1);
  const [loadingMoreFeed, setLoadingMoreFeed] = useState(false);

  useEffect(() => {
    usersAPI.getAll()
      .then(({ data: env }) => {
        switch (env.status) {
          case 'SUCCESS':  setUsers(env.data); setViewStatus('SUCCESS'); break;
          case 'NO_DATA':  setUsers([]); setViewStatus('NO_DATA'); break;
          default:         setViewStatus(env.status || 'SERVER_ERROR');
        }
      })
      .catch((err) => {
        setViewStatus(err.response?.data?.status || 'SERVER_ERROR');
        setError(err.response?.data?.message || 'Failed to fetch users.');
      });

    activityAPI.getAll({ page: 1, limit: 20 })
      .then(({ data: env }) => {
        if (env.status === 'SUCCESS') {
          setActivityLogs(env.data.logs);
          setActivityHasMore(env.data.hasMore);
          setFeedStatus('SUCCESS');
        } else {
          setFeedStatus(env.status);
        }
      })
      .catch(() => setFeedStatus('SERVER_ERROR'));
  }, []);

  // ── Expand a user row — lazily fetch their last 5 activities ────────────
  const handleToggleExpand = (userId) => {
    if (expandedUserId === userId) { setExpandedUserId(null); return; }
    setExpandedUserId(userId);
    if (userActivity[userId] !== undefined) return; // already loaded
    setUserActivity((prev) => ({ ...prev, [userId]: null })); // null = loading
    activityAPI.getAll({ userId, page: 1, limit: 5 })
      .then(({ data: env }) => {
        setUserActivity((prev) => ({
          ...prev,
          [userId]: env.status === 'SUCCESS' ? env.data.logs : [],
        }));
      })
      .catch(() => setUserActivity((prev) => ({ ...prev, [userId]: [] })));
  };

  // ── Load More for global activity feed ──────────────────────────────────
  const handleLoadMoreFeed = async () => {
    const next = activityPage + 1;
    setActivityPage(next);
    setLoadingMoreFeed(true);
    try {
      const { data: env } = await activityAPI.getAll({ page: next, limit: 20 });
      if (env.status === 'SUCCESS') {
        setActivityLogs((prev) => [...prev, ...env.data.logs]);
        setActivityHasMore(env.data.hasMore);
      }
    } finally {
      setLoadingMoreFeed(false);
    }
  };

  // ── Mutations ───────────────────────────────────────────────────────────
  const handleRoleChange = async (userId, newRole) => {
    setUpdatingUserId(userId);
    try {
      const { data: env } = await usersAPI.update(userId, { role: newRole });
      if (env.status === 'UPDATED') setUsers((prev) => prev.map((u) => (u._id === userId ? env.data : u)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleBlock = async (userId) => {
    setUpdatingUserId(userId);
    try {
      const { data: env } = await usersAPI.toggleBlock(userId);
      if (env.status === 'UPDATED') setUsers((prev) => prev.map((u) => (u._id === userId ? env.data : u)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle block state.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const startEditPageSize = (u) => { setEditingPageSize(u._id); setPageSizeInput(String(u.pageSize || 12)); };

  const handleSavePageSize = async (userId) => {
    const val = parseInt(pageSizeInput);
    if (isNaN(val) || val < 1 || val > 100) { setError('Page size must be between 1 and 100.'); return; }
    setUpdatingUserId(userId);
    try {
      const { data: env } = await usersAPI.update(userId, { pageSize: val });
      if (env.status === 'UPDATED') {
        setUsers((prev) => prev.map((u) => (u._id === userId ? env.data : u)));
        setEditingPageSize(null);
        if (userId === currentUser._id) {
          updateUserData(env.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update page size.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
  };

  const getInitials = (u) =>
    u.name ? u.name.charAt(0).toUpperCase() : u.username.charAt(0).toUpperCase();

  if (viewStatus === 'LOADING') return <Loader message="Loading admin panel..." />;

  const totalUsers   = users.length;
  const adminCount   = users.filter((u) => u.role === 'admin').length;
  const activeCount  = users.filter((u) => u.isActive).length;
  const blockedCount = totalUsers - activeCount;

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u._id?.toLowerCase().includes(q) ||
      (u.isActive ? 'active' : 'blocked').includes(q)
    );
  });

  return (
    <div className="page-content">
      <div className="container">

        <div className="admin-header">
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-subtitle">Manage users and monitor activity</p>
        </div>

        {error && (
          <div className="alert alert-error">
            ⚠ {error}
            <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {(viewStatus === 'SERVER_ERROR' || viewStatus === 'FORBIDDEN') && !error && (
          <div className="alert alert-error">⚠ {viewStatus === 'FORBIDDEN' ? 'Access denied.' : 'Failed to load users.'}</div>
        )}

        {/* ── Stats ── */}
        <div className="admin-stats">
          <div className="stat-card"><div className="stat-value">{totalUsers}</div><div className="stat-label">Total Users</div></div>
          <div className="stat-card"><div className="stat-value">{adminCount}</div><div className="stat-label">Admins</div></div>
          <div className="stat-card"><div className="stat-value">{activeCount}</div><div className="stat-label">Active</div></div>
          <div className="stat-card" style={{ borderLeft: blockedCount > 0 ? '2px solid var(--color-danger)' : undefined }}>
            <div className="stat-value" style={{ color: blockedCount > 0 ? 'var(--color-danger)' : undefined }}>{blockedCount}</div>
            <div className="stat-label">Blocked</div>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="admin-controls">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input type="text" className="form-input search-input" placeholder="Search by name, username, email, role…"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        {/* ── Users table (slim) ── */}
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Page Size</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {viewStatus === 'NO_DATA' || filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-2xl)' }}>
                    {viewStatus === 'NO_DATA' ? 'No users in the system.' : 'No users match your search.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <Fragment key={u._id}>
                    {/* Main row */}
                    <tr className={[
                      !u.isActive ? 'blocked-row' : '',
                      expandedUserId === u._id ? 'user-row-expanded' : '',
                    ].join(' ')} id={`user-row-${u._id}`}>

                      <td>
                        <div className="user-cell">
                          <button className="expand-btn" onClick={() => handleToggleExpand(u._id)}
                            title={expandedUserId === u._id ? 'Collapse' : 'Expand'}>
                            {expandedUserId === u._id ? '▼' : '▶'}
                          </button>
                          <div className="user-avatar">{getInitials(u)}</div>
                          <div>
                            <div style={{ fontWeight: 600, lineHeight: 1.3 }}>{u.name || 'No Name'}</div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        {currentUser._id === u._id ? (
                          <span className="badge badge-success" style={{ textTransform: 'capitalize' }}>{u.role}</span>
                        ) : (
                          <select className="role-select" value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            disabled={updatingUserId === u._id} id={`role-select-${u._id}`}>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>

                      <td>
                        {u.isActive
                          ? <span className="badge badge-success">Active</span>
                          : <span className="badge badge-danger">Blocked</span>}
                      </td>

                      <td>
                        {editingPageSize === u._id ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <input type="number" min={1} max={100} value={pageSizeInput}
                              onChange={(e) => setPageSizeInput(e.target.value)}
                              style={{ width: 52, padding: '2px 4px', borderRadius: 4, border: '1px solid var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }} />
                            <button className="btn btn-sm btn-primary" onClick={() => handleSavePageSize(u._id)} disabled={updatingUserId === u._id}>✓</button>
                            <button className="btn btn-sm btn-secondary" onClick={() => setEditingPageSize(null)}>✕</button>
                          </div>
                        ) : (
                          <button className="btn btn-sm btn-secondary" onClick={() => startEditPageSize(u)} title="Edit page size">
                            {u.pageSize || 12}
                          </button>
                        )}
                      </td>

                      <td>
                        {currentUser._id === u._id ? (
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Self</span>
                        ) : (
                          <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => handleToggleBlock(u._id)} disabled={updatingUserId === u._id}
                            id={`block-toggle-${u._id}`}>
                            {updatingUserId === u._id ? '…' : u.isActive ? 'Block' : 'Unblock'}
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded details row */}
                    {expandedUserId === u._id && (
                      <tr className="user-expand-row">
                        <td colSpan={5}>
                          <div className="user-expand-content">

                            <div className="user-expand-details">
                              <div className="expand-detail-item">
                                <span className="detail-label">Username</span>
                                <span>@{u.username}</span>
                              </div>
                              <div className="expand-detail-item">
                                <span className="detail-label">Email</span>
                                <span>{u.email || '—'}</span>
                              </div>
                              <div className="expand-detail-item">
                                <span className="detail-label">Last Login</span>
                                <span>{formatDate(u.lastLogin)}</span>
                              </div>
                              <div className="expand-detail-item">
                                <span className="detail-label">Last Activity</span>
                                <span>{formatDate(u.lastActivityAt)}</span>
                              </div>
                            </div>

                            <div className="user-expand-activity">
                              <h4>Recent Activity</h4>
                              {userActivity[u._id] === null ? (
                                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>Loading…</p>
                              ) : !userActivity[u._id] || userActivity[u._id].length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>No activity recorded yet.</p>
                              ) : (
                                userActivity[u._id].map((log) => (
                                  <div key={log._id} className="activity-item-mini">
                                    <span className={`badge ${ACTION_BADGE[log.action] || 'badge'}`} style={{ fontSize: '0.6rem' }}>{log.action}</span>
                                    <span className={`badge ${RESOURCE_BADGE[log.resourceType] || 'badge'}`} style={{ fontSize: '0.6rem' }}>{log.resourceType}</span>
                                    <span className="activity-resource-title">{truncate(log.resourceTitle, 40)}</span>
                                    <span className="activity-time">{timeAgo(log.timestamp)}</span>
                                  </div>
                                ))
                              )}
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Global Activity Feed ── */}
        <div className="activity-feed">
          <div className="activity-feed-header">
            <h2 className="activity-feed-title">Recent Activity</h2>
          </div>

          {feedStatus === 'LOADING' && <Loader message="Loading activity…" />}

          {feedStatus === 'NO_DATA' && (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-2xl)' }}>
              No activity recorded yet. Start using the app to see logs here.
            </div>
          )}

          {feedStatus === 'SERVER_ERROR' && (
            <div className="alert alert-error">⚠ Failed to load activity feed.</div>
          )}

          {feedStatus === 'SUCCESS' && (
            <>
              <div className="activity-list">
                {activityLogs.map((log) => (
                  <div key={log._id} className="activity-item">
                    <div className="user-avatar" style={{ width: 28, height: 28, fontSize: '0.7rem', flexShrink: 0 }}>
                      {log.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span className="activity-user">{log.userId?.username || '?'}</span>
                    <span className={`badge ${ACTION_BADGE[log.action] || 'badge'}`} style={{ fontSize: '0.65rem' }}>{log.action}</span>
                    <span className={`badge ${RESOURCE_BADGE[log.resourceType] || 'badge'}`} style={{ fontSize: '0.65rem' }}>{log.resourceType}</span>
                    <span className="activity-resource-title">"{truncate(log.resourceTitle)}"</span>
                    <span className="activity-time">{timeAgo(log.timestamp)}</span>
                  </div>
                ))}
              </div>

              {activityHasMore && (
                <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
                  <button className="btn btn-secondary" onClick={handleLoadMoreFeed} disabled={loadingMoreFeed}>
                    {loadingMoreFeed ? 'Loading…' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default Admin;
