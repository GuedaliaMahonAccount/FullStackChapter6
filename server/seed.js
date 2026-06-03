require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const User = require('./models/User');
const Todo = require('./models/Todo');
const Post = require('./models/Post');
const Comment = require('./models/Comment');

const seedData = async () => {
  try {
    // 1. Connect to Database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding...');

    // 2. Clear existing collections
    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Todo.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
    ]);
    console.log('🧹 Database cleared.');

    // 3. Create Users
    console.log('🌱 Seeding users...');
    const users = await User.create([
      {
        username: 'admin',
        password: 'password123',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        isActive: true,
      },
      {
        username: 'guedalia',
        password: 'password123',
        name: 'Guedalia Mahon',
        email: 'guedalia@example.com',
        role: 'user',
        isActive: true,
      },
      {
        username: 'alice',
        password: 'password123',
        name: 'Alice Smith',
        email: 'alice@example.com',
        role: 'user',
        isActive: true,
      },
    ]);
    console.log(`🌱 Seeded ${users.length} users successfully.`);

    const [adminUser, guedaliaUser, aliceUser] = users;

    // 4. Create Todos
    console.log('🌱 Seeding todos...');
    const todos = await Todo.create([
      {
        userId: guedaliaUser._id,
        title: 'Complete Phase 6 of fullstack project',
        completed: false,
      },
      {
        userId: guedaliaUser._id,
        title: 'Review Mongoose models and controllers',
        completed: true,
      },
      {
        userId: guedaliaUser._id,
        title: 'Write project documentation',
        completed: false,
      },
      {
        userId: aliceUser._id,
        title: 'Set up Vite + React development environment',
        completed: true,
      },
      {
        userId: aliceUser._id,
        title: 'Implement unit testing with Jest',
        completed: false,
      },
    ]);
    console.log(`🌱 Seeded ${todos.length} todos successfully.`);

    // 5. Create Posts
    console.log('🌱 Seeding posts...');
    const posts = await Post.create([
      {
        userId: guedaliaUser._id,
        title: 'The Future of Full-Stack Development',
        body: 'Full-stack development continues to evolve rapidly. With frameworks like React/Vite on the client and Express/Mongoose on the server, building modern, responsive, and secure web applications has never been more enjoyable. Soft deletion is an elegant pattern for data preservation, and JWT handles stateless authentication smoothly.',
      },
      {
        userId: aliceUser._id,
        title: 'Mastering React State Management',
        body: 'React hooks like useState, useEffect, and useContext provide a powerful foundation for managing component state. By isolating auth states and utilizing responsive layouts with CSS glassmorphism, you can deliver an outstanding user experience with high-performance aesthetics.',
      },
    ]);
    console.log(`🌱 Seeded ${posts.length} posts successfully.`);

    const [post1, post2] = posts;

    // 6. Create Comments
    console.log('🌱 Seeding comments...');
    const comments = await Comment.create([
      {
        postId: post1._id,
        userId: aliceUser._id,
        name: aliceUser.username,
        email: aliceUser.email,
        body: 'Excellent write-up! I completely agree that soft deletion is a crucial requirement for enterprise applications to preserve references and audit logs.',
      },
      {
        postId: post1._id,
        userId: adminUser._id,
        name: adminUser.username,
        email: adminUser.email,
        body: 'Great article, Guedalia. Let us make sure that we enforce proper indexing on references in MongoDB to support fast query performance.',
      },
      {
        postId: post2._id,
        userId: guedaliaUser._id,
        name: guedaliaUser.username,
        email: guedaliaUser.email,
        body: 'Very clean explanations on hooks. The useContext hook combined with Axios interceptors really simplifies the auth flow in React.',
      },
    ]);
    console.log(`🌱 Seeded ${comments.length} comments successfully.`);

    console.log('🚀 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

seedData();
