import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import UserInfoModal from './UserInfoModal';
import './Navbar.css';

/**
 * Navbar Component
 * 
 * Top navigation bar with:
 * - App branding
 * - Navigation links (Todos, Posts, Profile)
 * - Admin link (if admin role)
 * - Info button (shows user details modal)
 * - Logout button
 */
const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const [showInfo, setShowInfo] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const basePath = `/users/${user.username}`;

  return (
    <>
      <nav className="navbar" id="main-navbar">
        <div className="navbar-inner container">
          {/* Brand */}
          <NavLink to={`${basePath}/todos`} className="navbar-brand">
            <span className="brand-icon">{'{ }'}</span>
            <span className="brand-text">JSONPlaceholder</span>
          </NavLink>

          {/* Mobile Toggle */}
          <button
            className="navbar-toggle btn-icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>

          {/* Nav Links */}
          <div className={`navbar-links ${mobileOpen ? 'active' : ''}`}>
            <NavLink
              to={`${basePath}/todos`}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              ✓ Todos
            </NavLink>
            <NavLink
              to={`${basePath}/posts`}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              ✎ Posts
            </NavLink>
            <NavLink
              to={`${basePath}/profile`}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              ◉ Profile
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `nav-link nav-link-admin ${isActive ? 'nav-link-active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                ⚙ Admin
              </NavLink>
            )}
          </div>

          {/* Actions */}
          <div className="navbar-actions">
            <button
              className="navbar-info-btn"
              onClick={() => setShowInfo(true)}
              title="User Info"
              id="user-info-button"
            >
              <span className="info-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </span>
              <span className="info-name">{user.name?.split(' ')[0]}</span>
            </button>

            <button
              className="btn btn-sm btn-danger"
              onClick={logout}
              id="logout-button"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <UserInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
    </>
  );
};

export default Navbar;
