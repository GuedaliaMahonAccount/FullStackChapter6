import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usersAPI } from '../api/api';
import '../styles/Profile.css';

/**
 * Profile Page
 * 
 * Allows users to:
 * 1. View their profile details.
 * 2. Update their basic info (name, email) which persists in DB + context.
 * 3. Change their account password securely.
 */
const Profile = () => {
  const { user, updateUserData } = useAuth();

  // Basic Info Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [infoError, setInfoError] = useState('');
  const [infoSuccess, setInfoSuccess] = useState('');
  const [updatingInfo, setUpdatingInfo] = useState(false);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // ─── Actions ───────────────────────────────────
  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setUpdatingInfo(true);
    setInfoError('');
    setInfoSuccess('');

    try {
      const { data } = await usersAPI.update(user._id, {
        name: name.trim(),
        email: email.trim(),
      });
      updateUserData(data);
      setInfoSuccess('Profile updated successfully.');
    } catch (err) {
      setInfoError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setUpdatingInfo(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    setChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      await usersAPI.changePassword(user._id, {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="page-content">
        <div className="container">
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  const getInitials = () => {
    return user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase();
  };

  return (
    <div className="page-content">
      <div className="container">
        <div className="profile-container">
          
          {/* Header Card */}
          <div className="profile-header">
            <div className="profile-avatar-large">{getInitials()}</div>
            <div className="profile-meta-info">
              <h2>{user.name || user.username}</h2>
              <p>
                <span className="badge badge-accent">@{user.username}</span>
                <span className="badge badge-success" style={{ textTransform: 'capitalize' }}>
                  {user.role}
                </span>
              </p>
            </div>
          </div>

          <div className="profile-grid">
            {/* edit profile card */}
            <div className="profile-card">
              <h3 className="profile-card-title">Update Info</h3>

              {infoError && (
                <div className="alert alert-error">
                  ⚠ {infoError}
                </div>
              )}
              {infoSuccess && (
                <div className="alert alert-success">
                  ✓ {infoSuccess}
                </div>
              )}

              <form onSubmit={handleUpdateInfo} id="update-profile-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-name">Full Name</label>
                  <input
                    id="profile-name"
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-email">Email Address</label>
                  <input
                    id="profile-email"
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 'var(--space-sm)' }}
                  disabled={updatingInfo || !name.trim() || !email.trim()}
                >
                  {updatingInfo ? 'Saving...' : 'Save Info'}
                </button>
              </form>
            </div>

            {/* change password card */}
            <div className="profile-card">
              <h3 className="profile-card-title">Change Password</h3>

              {passwordError && (
                <div className="alert alert-error">
                  ⚠ {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="alert alert-success">
                  ✓ {passwordSuccess}
                </div>
              )}

              <form onSubmit={handleChangePassword} id="change-password-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="current-password">Current Password</label>
                  <input
                    id="current-password"
                    type="password"
                    className="form-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-password">New Password</label>
                  <input
                    id="new-password"
                    type="password"
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 'var(--space-sm)' }}
                  disabled={
                    changingPassword || !currentPassword || !newPassword || !confirmPassword
                  }
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
