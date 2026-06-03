import axios from 'axios';

/**
 * Centralized Axios instance for all API calls.
 * 
 * - Base URL points to the Express server.
 * - Request interceptor attaches JWT from localStorage.
 * - Response interceptor handles 401 (expired/invalid token) globally.
 */
const API = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ────────────────────────────
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ───────────────────────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // On 401: clear auth data and redirect to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Only redirect if not already on login/register
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════════
// Auth API
// ═══════════════════════════════════════════════════════
export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
};

// ═══════════════════════════════════════════════════════
// Users API
// ═══════════════════════════════════════════════════════
export const usersAPI = {
  getAll: (params) => API.get('/users', { params }),
  getById: (id) => API.get(`/users/${id}`),
  update: (id, data) => API.put(`/users/${id}`, data),
  changePassword: (id, data) => API.put(`/users/${id}/password`, data),
  toggleBlock: (id) => API.patch(`/users/${id}/block`),
};

// ═══════════════════════════════════════════════════════
// Todos API
// ═══════════════════════════════════════════════════════
export const todosAPI = {
  getAll: (params) => API.get('/todos', { params }),
  getById: (id) => API.get(`/todos/${id}`),
  create: (data) => API.post('/todos', data),
  update: (id, data) => API.put(`/todos/${id}`, data),
  delete: (id) => API.delete(`/todos/${id}`),
};

// ═══════════════════════════════════════════════════════
// Posts API
// ═══════════════════════════════════════════════════════
export const postsAPI = {
  getAll: (params) => API.get('/posts', { params }),
  getById: (id) => API.get(`/posts/${id}`),
  getByUser: (userId) => API.get(`/users/${userId}/posts`),
  getComments: (postId) => API.get(`/posts/${postId}/comments`),
  create: (data) => API.post('/posts', data),
  update: (id, data) => API.put(`/posts/${id}`, data),
  delete: (id) => API.delete(`/posts/${id}`),
};

// ═══════════════════════════════════════════════════════
// Comments API
// ═══════════════════════════════════════════════════════
export const commentsAPI = {
  getAll: (params) => API.get('/comments', { params }),
  getById: (id) => API.get(`/comments/${id}`),
  create: (data) => API.post('/comments', data),
  update: (id, data) => API.put(`/comments/${id}`, data),
  delete: (id) => API.delete(`/comments/${id}`),
};

export default API;
