import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './UserInfoModal.css';

/**
 * UserInfoModal
 * 
 * Displays the logged-in user's personal details in a modal overlay.
 * Triggered by the Info button in the Navbar.
 */
const UserInfoModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">User Info</h3>
          <button className="modal-close btn-icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="user-avatar">
            {user.name?.charAt(0).toUpperCase()}
          </div>

          <div className="user-detail-grid">
            <div className="user-detail">
              <span className="user-detail-label">Name</span>
              <span className="user-detail-value">{user.name}</span>
            </div>
            <div className="user-detail">
              <span className="user-detail-label">Username</span>
              <span className="user-detail-value">@{user.username}</span>
            </div>
            <div className="user-detail">
              <span className="user-detail-label">Email</span>
              <span className="user-detail-value">{user.email}</span>
            </div>
            <div className="user-detail">
              <span className="user-detail-label">Role</span>
              <span className={`badge ${user.role === 'admin' ? 'badge-warning' : 'badge-accent'}`}>
                {user.role}
              </span>
            </div>
            <div className="user-detail">
              <span className="user-detail-label">User ID</span>
              <span className="user-detail-value user-detail-id">{user._id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfoModal;
