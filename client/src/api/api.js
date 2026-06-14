import axios from 'axios';

// Create a common base URL of the backend API and default headers.
const API = axios.create({
  baseURL: 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});

// Intercept used to automatically attach the JWT token from localStorage to every request.
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  // At case of unvalid or expired token, we log out the user and redirect to login page.
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------------------------------------------------------------
// Define API functions for each resource type, which can be imported and used in React components to interact with the backend API.
// ---------------------------------------------------------------------------------------------------------------------------------

export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  me: () => API.get('/auth/me'),
};

export const usersAPI = {
  getAll: (params) => API.get('/users', { params }),
  getById: (id) => API.get(`/users/${id}`),
  update: (id, data) => API.put(`/users/${id}`, data),
  changePassword: (id, data) => API.put(`/users/${id}/password`, data),
  toggleBlock: (id) => API.patch(`/users/${id}/block`),
};

export const todosAPI = {
  getAll: (params) => API.get('/todos', { params }),
  getById: (id) => API.get(`/todos/${id}`),
  create: (data) => API.post('/todos', data),
  update: (id, data) => API.put(`/todos/${id}`, data),
  delete: (id) => API.delete(`/todos/${id}`),
};

export const postsAPI = {
  getAll: (params) => API.get('/posts', { params }),
  getById: (id) => API.get(`/posts/${id}`),
  getByUser: (userId, params) => API.get(`/users/${userId}/posts`, { params }),
  getComments: (postId) => API.get(`/posts/${postId}/comments`),
  create: (data) => API.post('/posts', data),
  update: (id, data) => API.put(`/posts/${id}`, data),
  delete: (id) => API.delete(`/posts/${id}`),
};

export const commentsAPI = {
  getAll: (params) => API.get('/comments', { params }),
  getById: (id) => API.get(`/comments/${id}`),
  create: (data) => API.post('/comments', data),
  update: (id, data) => API.put(`/comments/${id}`, data),
  delete: (id) => API.delete(`/comments/${id}`),
};

export const albumsAPI = {
  getAll: (params) => API.get('/albums', { params }),
  getById: (id) => API.get(`/albums/${id}`),
  getPhotos: (id, params) => API.get(`/albums/${id}/photos`, { params }),
  create: (data) => API.post('/albums', data),
  update: (id, data) => API.put(`/albums/${id}`, data),
  delete: (id) => API.delete(`/albums/${id}`),
  addPhoto: (albumId, data) => API.post(`/albums/${albumId}/photos`, data),
  deletePhoto: (albumId, photoId) => API.delete(`/albums/${albumId}/photos/${photoId}`),
};

export const dashboardAPI = {
  getStats: () => API.get('/dashboard/stats'),
};

export const activityAPI = {
  getAll: (params) => API.get('/activity', { params }),
};

export default API;
