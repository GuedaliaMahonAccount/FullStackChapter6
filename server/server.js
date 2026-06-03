/**
 * JSONPlaceholder Clone — Express Server
 * Author: Guedalia
 * 
 * Entry point for the REST API server.
 * Connects to MongoDB, mounts all route modules, and starts listening.
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const todoRoutes = require('./routes/todoRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');

// Post controller for nested user routes
const { getUserPosts } = require('./controllers/postController');
const { auth } = require('./middleware/auth');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------- Health Check ---------------
app.get('/', (_req, res) => {
  res.json({
    message: 'JSONPlaceholder Clone API — by Guedalia',
    version: '1.0.0',
    endpoints: {
      auth: 'POST /auth/login, POST /auth/register',
      users: 'GET /users, GET /users/:id, PUT /users/:id, PUT /users/:id/password, PATCH /users/:id/block',
      todos: 'GET /todos, GET /todos/:id, POST /todos, PUT /todos/:id, DELETE /todos/:id',
      posts: 'GET /posts, GET /posts/:id, POST /posts, PUT /posts/:id, DELETE /posts/:id, GET /posts/:id/comments',
      comments: 'GET /comments, GET /comments/:id, POST /comments, PUT /comments/:id, DELETE /comments/:id',
      nested: 'GET /users/:userId/posts',
    },
  });
});

// --------------- Routes ---------------
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/todos', todoRoutes);
app.use('/posts', postRoutes);
app.use('/comments', commentRoutes);

// Nested route: GET /users/:userId/posts (jsonplaceholder style)
app.get('/users/:userId/posts', auth, getUserPosts);

// --------------- 404 Handler ---------------
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// --------------- Error Handler ---------------
app.use(errorHandler);

// --------------- Start Server ---------------
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();
