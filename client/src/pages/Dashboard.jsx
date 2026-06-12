import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { dashboardAPI } from '../api/api';
import Loader from '../components/Loader';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewStatus, setViewStatus] = useState('LOADING');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(({ data: env }) => {
        setStats(env.data);
        setViewStatus(env.status);
      })
      .catch((err) => {
        setViewStatus(err.response?.data?.status || 'SERVER_ERROR');
      });
  }, []);

  if (viewStatus === 'LOADING') return <Loader message="Loading dashboard..." />;

  const basePath = `/users/${user.username}`;

  return (
    <div className="page-content">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Welcome back, {user.name?.split(' ')[0]}!</h1>
          <p className="dashboard-subtitle">Here's a summary of your content</p>
        </div>

        {viewStatus === 'SERVER_ERROR' && (
          <div className="alert alert-error">⚠ Failed to load stats. Please refresh.</div>
        )}

        <div className="dashboard-grid">
          <button className="dashboard-card dashboard-card-todos" onClick={() => navigate(`${basePath}/todos`)}>
            <div className="dashboard-card-icon">✓</div>
            <div className="dashboard-card-body">
              <div className="dashboard-card-title">Todos</div>
              {viewStatus === 'SUCCESS' && stats && (
                <div className="dashboard-card-stats">
                  <span className="stat-big">{stats.todos.total}</span>
                  <div className="stat-sub">
                    <span className="stat-done">{stats.todos.completed} done</span>
                    <span className="stat-sep">·</span>
                    <span className="stat-active">{stats.todos.active} active</span>
                  </div>
                </div>
              )}
            </div>
          </button>

          <button className="dashboard-card dashboard-card-posts" onClick={() => navigate(`${basePath}/posts`)}>
            <div className="dashboard-card-icon">✎</div>
            <div className="dashboard-card-body">
              <div className="dashboard-card-title">Posts</div>
              {viewStatus === 'SUCCESS' && stats && (
                <div className="dashboard-card-stats">
                  <span className="stat-big">{stats.posts.total}</span>
                  <div className="stat-sub"><span>published</span></div>
                </div>
              )}
            </div>
          </button>

          <button className="dashboard-card dashboard-card-albums" onClick={() => navigate(`${basePath}/albums`)}>
            <div className="dashboard-card-icon">⊞</div>
            <div className="dashboard-card-body">
              <div className="dashboard-card-title">Albums</div>
              {viewStatus === 'SUCCESS' && stats && (
                <div className="dashboard-card-stats">
                  <span className="stat-big">{stats.albums.total}</span>
                  <div className="stat-sub"><span>photo albums</span></div>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
