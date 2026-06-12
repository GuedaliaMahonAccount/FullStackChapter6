import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authAPI, usersAPI } from '../api/api';
import Loader from '../components/Loader';
import '../styles/Profile.css';

const Profile = () => {
  const { user, updateUserData } = useAuth();

  // Full profile is fetched on demand — not carried in the auth context
  const [profileStatus, setProfileStatus] = useState('LOADING');
  const [profileData, setProfileData] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [infoError, setInfoError] = useState('');
  const [infoSuccess, setInfoSuccess] = useState('');
  const [updatingInfo, setUpdatingInfo] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch full profile data only when this page mounts
  useEffect(() => {
    authAPI.me()
      .then(({ data: env }) => {
        if (env.status === 'SUCCESS') {
          setProfileData(env.data);
          setName(env.data.name || '');
          setEmail(env.data.email || '');
        }
        setProfileStatus(env.status);
      })
      .catch((err) => {
        setProfileStatus(err.response?.data?.status || 'SERVER_ERROR');
      });
  }, []);

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setUpdatingInfo(true);
    setInfoError('');
    setInfoSuccess('');
    try {
      const { data: env } = await usersAPI.update(user._id, { name: name.trim(), email: email.trim() });
      if (env.status === 'UPDATED') {
        setProfileData(env.data);
        // Sync name back to context so the navbar / dashboard greeting updates
        updateUserData({ ...user, name: env.data.name });
        setInfoSuccess('Profile updated successfully.');
      }
    } catch (err) {
      setInfoError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setUpdatingInfo(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match.'); return; }
    if (newPassword.length < 6) { setPasswordError('New password must be at least 6 characters.'); return; }

    setChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      const { data: env } = await usersAPI.changePassword(user._id, { currentPassword, newPassword });
      if (env.status === 'UPDATED') {
        setPasswordSuccess('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (profileStatus === 'LOADING') return <Loader message="Loading profile..." />;

  if (profileStatus !== 'SUCCESS') {
    return (
      <div className="page-content">
        <div className="container">
          <div className="alert alert-error">⚠ Failed to load profile. Please try again.</div>
        </div>
      </div>
    );
  }

  const getInitials = () =>
    profileData.name ? profileData.name.charAt(0).toUpperCase() : profileData.username.charAt(0).toUpperCase();

  const formatDate = (d) => {
    if (!d) return 'Never';
    return new Date(d).toLocaleString('he-IL', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="page-content">
      <div className="container">
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar-large">{getInitials()}</div>
            <div className="profile-meta-info">
              <h2>{profileData.name || profileData.username}</h2>
              <p>
                <span className="badge badge-accent">@{profileData.username}</span>
                <span className="badge badge-success" style={{ textTransform: 'capitalize' }}>{profileData.role}</span>
              </p>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-xs)' }}>
                Last login: {formatDate(profileData.lastLogin)}
              </p>
            </div>
          </div>

          <div className="profile-grid">
            <div className="profile-card">
              <h3 className="profile-card-title">Update Info</h3>
              {infoError   && <div className="alert alert-error">⚠ {infoError}</div>}
              {infoSuccess && <div className="alert alert-success">✓ {infoSuccess}</div>}
              <form onSubmit={handleUpdateInfo} id="update-profile-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-name">Full Name</label>
                  <input id="profile-name" type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-email">Email Address</label>
                  <input id="profile-email" type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-sm)' }} disabled={updatingInfo || !name.trim() || !email.trim()}>
                  {updatingInfo ? 'Saving...' : 'Save Info'}
                </button>
              </form>
            </div>

            <div className="profile-card">
              <h3 className="profile-card-title">Change Password</h3>
              {passwordError   && <div className="alert alert-error">⚠ {passwordError}</div>}
              {passwordSuccess && <div className="alert alert-success">✓ {passwordSuccess}</div>}
              <form onSubmit={handleChangePassword} id="change-password-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="current-password">Current Password</label>
                  <input id="current-password" type="password" className="form-input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-password">New Password</label>
                  <input id="new-password" type="password" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
                  <input id="confirm-password" type="password" className="form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-sm)' }} disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}>
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
