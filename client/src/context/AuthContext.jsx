import { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load from localStorage, then refresh from server to pick up admin changes (e.g. pageSize)
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser  = localStorage.getItem('user');

    if (!storedToken || !storedUser) { setLoading(false); return; }

    let parsed;
    try { parsed = JSON.parse(storedUser); } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setLoading(false);
      return;
    }

    // Apply stale data immediately so the UI can render
    setToken(storedToken);
    setUser(parsed);

    // Refresh in background — picks up any admin changes
    authAPI.me()
      .then(({ data: env }) => {
        if (env.status === 'SUCCESS') {
          setUser(env.data);
          localStorage.setItem('user', JSON.stringify(env.data));
        }
      })
      .catch(() => {
        // Token revoked or expired — axios interceptor handles 401 redirect
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const { data: env } = await authAPI.login({ username, password });
    // env.status === 'SUCCESS', env.data === { token, user }
    localStorage.setItem('token', env.data.token);
    localStorage.setItem('user', JSON.stringify(env.data.user));
    setToken(env.data.token);
    setUser(env.data.user);
    navigate(`/users/${env.data.user.username}/dashboard`);
    return env.data;
  }, [navigate]);

  const register = useCallback(async (userData) => {
    const { data: env } = await authAPI.register(userData);
    localStorage.setItem('token', env.data.token);
    localStorage.setItem('user', JSON.stringify(env.data.user));
    setToken(env.data.token);
    setUser(env.data.user);
    navigate(`/users/${env.data.user.username}/dashboard`);
    return env.data;
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const updateUserData = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
