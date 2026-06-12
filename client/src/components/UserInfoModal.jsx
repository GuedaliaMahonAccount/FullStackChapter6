import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../api/api';
import './UserInfoModal.css';

const UserInfoModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch full profile only when the modal is opened
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    authAPI.me()
      .then(({ data: env }) => {
        if (env.status === 'SUCCESS') setProfileData(env.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const display = profileData || user;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">User Info</h3>
          <button className="modal-close btn-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          <div className="user-avatar">
            {display.name?.charAt(0).toUpperCase()}
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-md)' }}>Loading...</p>
          ) : (
            <div className="user-detail-grid">
              <div className="user-detail">
                <span className="user-detail-label">Name</span>
                <span className="user-detail-value">{display.name}</span>
              </div>
              <div className="user-detail">
                <span className="user-detail-label">Username</span>
                <span className="user-detail-value">@{display.username}</span>
              </div>
              <div className="user-detail">
                <span className="user-detail-label">Email</span>
                <span className="user-detail-value">{display.email || '—'}</span>
              </div>
              <div className="user-detail">
                <span className="user-detail-label">Role</span>
                <span className={`badge ${display.role === 'admin' ? 'badge-warning' : 'badge-accent'}`}>
                  {display.role}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserInfoModal;
