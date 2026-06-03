import { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/api';

/**
 * AuthContext
 * 
 * Provides authentication state and actions (login, register, logout)
 * to the entire app via React Context.
 * Persists auth data in localStorage.
 */
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  /**
   * Log in with username and password.
   * Stores token + user in state and localStorage.
   */
  const login = useCallback(async (username, password) => {
    const { data } = await authAPI.login({ username, password });

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);

    navigate(`/users/${data.user.username}/todos`);
    return data;
  }, [navigate]);

  /**
   * Register a new account.
   * Stores token + user in state and localStorage.
   */
  const register = useCallback(async (userData) => {
    const { data } = await authAPI.register(userData);

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);

    navigate(`/users/${data.user.username}/todos`);
    return data;
  }, [navigate]);

  /**
   * Log out: clear state and localStorage, redirect to login.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  /**
   * Update user data in context and localStorage
   * (used after profile edits).
   */
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
