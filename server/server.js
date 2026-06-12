const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const todoRoutes = require('./routes/todoRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const albumRoutes = require('./routes/albumRoutes');
const activityRoutes = require('./routes/activityRoutes');

const { getUserPosts } = require('./controllers/postController');
const { auth } = require('./middleware/auth');

dotenv.config();

const app = express();

// ─── Security: prevent browsers / proxies from caching any API response ───
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('Pragma', 'no-cache');
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ message: 'JSONPlaceholder Clone API', version: '1.1.0' });
});

// ─── Dashboard stats endpoint ─────────────────────────────────────────────
const Todo = require('./models/Todo');
const Post = require('./models/Post');
const Album = require('./models/Album');

const { success: apiSuccess } = require('./utils/response');

app.get('/dashboard/stats', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [totalTodos, completedTodos, totalPosts, totalAlbums] = await Promise.all([
      Todo.countDocuments({ userId, isDeleted: false }),
      Todo.countDocuments({ userId, isDeleted: false, completed: true }),
      Post.countDocuments({ userId, isDeleted: false }),
      Album.countDocuments({ userId, isDeleted: false }),
    ]);
    return apiSuccess(res, {
      todos:  { total: totalTodos,  completed: completedTodos, active: totalTodos - completedTodos },
      posts:  { total: totalPosts },
      albums: { total: totalAlbums },
    }, 'Dashboard stats retrieved.');
  } catch (error) {
    next(error);
  }
});

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/todos', todoRoutes);
app.use('/posts', postRoutes);
app.use('/comments', commentRoutes);
app.use('/albums', albumRoutes);
app.use('/activity', activityRoutes);

app.get('/users/:userId/posts', auth, getUserPosts);

// ─── 404 ──────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  const { notFound } = require('./utils/response');
  notFound(res, 'Route not found.');
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
