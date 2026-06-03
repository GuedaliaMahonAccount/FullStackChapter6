import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usersAPI } from '../api/api';
import Loader from '../components/Loader';
import '../styles/Admin.css';

/**
 * Admin Panel Page
 * 
 * Accessible only by users with the 'admin' role (protected via ProtectedRoute).
 * Features:
 * 1. View overall user stats (Total, Admins, Active, Blocked).
 * 2. Search/filter users.
 * 3. Change user roles (admin/user) dynamically.
 * 4. Toggle account active/blocked status (preventing self-blocking).
 */
const Admin = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);

  // ─── Fetch Users ───────────────────────────────
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await usersAPI.getAll();
        setUsers(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch users.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // ─── Change Role ───────────────────────────────
  const handleRoleChange = async (userId, newRole) => {
    setUpdatingUserId(userId);
    try {
      const { data } = await usersAPI.update(userId, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: data.role } : u))
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change user role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ─── Block / Unblock ───────────────────────────
  const handleToggleBlock = async (userId) => {
    setUpdatingUserId(userId);
    try {
      const { data } = await usersAPI.toggleBlock(userId);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isActive: data.user.isActive } : u))
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to toggle block state.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ─── Stats Calculations ────────────────────────
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const activeCount = users.filter((u) => u.isActive).length;
  const blockedCount = totalUsers - activeCount;

  // ─── Search Filter ─────────────────────────────
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(query) ||
      u.username?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    );
  });

  const getInitials = (u) => {
    return u.name ? u.name.charAt(0).toUpperCase() : u.username.charAt(0).toUpperCase();
  };

  if (loading) return <Loader message="Loading admin panel..." />;

  return (
    <div className="page-content">
      <div className="container">
        
        {/* Header */}
        <div className="admin-header">
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-subtitle">Manage users, access permissions, and account status</p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="alert alert-error">
            ⚠ {error}
            <button
              onClick={() => setError('')}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-value">{totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{adminCount}</div>
            <div className="stat-label">Admins</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{activeCount}</div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-card" style={{ borderLeft: blockedCount > 0 ? '2px solid var(--color-danger)' : '1px solid var(--color-border)' }}>
            <div className="stat-value" style={{ color: blockedCount > 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
              {blockedCount}
            </div>
            <div className="stat-label">Blocked</div>
          </div>
        </div>

        {/* Controls */}
        <div className="admin-controls">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search by name, username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="search-users"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-2xl)' }}>
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u._id}
                    className={!u.isActive ? 'blocked-row' : ''}
                    id={`user-row-${u._id}`}
                  >
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">{getInitials(u)}</div>
                        <div style={{ fontWeight: 600 }}>{u.name || 'No Name'}</div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-accent">@{u.username}</span>
                    </td>
                    <td>{u.email || '-'}</td>
                    <td>
                      {currentUser._id === u._id ? (
                        <span className="badge badge-success" style={{ textTransform: 'capitalize' }}>
                          {u.role}
                        </span>
                      ) : (
                        <select
                          className="role-select"
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          disabled={updatingUserId === u._id}
                          id={`role-select-${u._id}`}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                    <td>
                      {u.isActive ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-danger">Blocked</span>
                      )}
                    </td>
                    <td>
                      {currentUser._id === u._id ? (
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                          Self (Active)
                        </span>
                      ) : (
                        <button
                          className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleToggleBlock(u._id)}
                          disabled={updatingUserId === u._id}
                          id={`block-toggle-${u._id}`}
                        >
                          {updatingUserId === u._id
                            ? 'Processing...'
                            : u.isActive
                            ? 'Block User'
                            : 'Unblock User'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default Admin;
