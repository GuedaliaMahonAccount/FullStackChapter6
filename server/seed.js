require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Todo = require('./models/Todo');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const Album = require('./models/Album');
const Photo = require('./models/Photo');

// 30 unique seeds per user — completely separate sets so photos are distinct across users
const USER_ALBUMS = [
  {
    username: 'guedalia',
    albumTitle: 'Travel & Nature',
    seeds: [
      'forest1','mountain2','river3','lake4','waterfall5',
      'sunset6','beach7','canyon8','glacier9','volcano10',
      'desert11','savanna12','jungle13','tundra14','reef15',
      'fjord16','meadow17','cliff18','dune19','creek20',
      'lagoon21','geyser22','marsh23','steppe24','rainforest25',
      'cave26','plateau27','valley28','delta29','tidal30',
    ],
  },
  {
    username: 'alice',
    albumTitle: 'City Life',
    seeds: [
      'bridge31','tower32','castle33','temple34','museum35',
      'stadium36','church37','palace38','market39','harbour40',
      'subway41','skyline42','alley43','plaza44','rooftop45',
      'cafe46','street47','library48','gallery49','arcade50',
      'park51','fountain52','mural53','station54','nightclub55',
      'loft56','intersection57','courtyard58','tunnel59','balcony60',
    ],
  },
  {
    username: 'admin',
    albumTitle: 'Abstract & Art',
    seeds: [
      'geometry61','pattern62','texture63','gradient64','spiral65',
      'fractal66','mosaic67','neon68','macro69','silhouette70',
      'bokeh71','prism72','shadow73','refraction74','symmetry75',
      'contrast76','minimalism77','motion78','portrait79','still80',
      'collage81','triptych82','negative83','exposure84','glitch85',
      'watercolor86','sketch87','ink88','pastel89','digital90',
    ],
  },
];

const makePhoto = (seed, index, albumTitle) => ({
  url: `https://picsum.photos/seed/${seed}/600/400`,
  thumbnailUrl: `https://picsum.photos/seed/${seed}/150/150`,
  title: `${albumTitle} #${index + 1}`,
});

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Todo.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
      Album.deleteMany({}),
      Photo.deleteMany({}),
    ]);
    console.log('Database cleared.');

    // ─── Users ────────────────────────────────────────
    console.log('Seeding users...');
    const users = await User.create([
      { username: 'admin',    password: 'password123', name: 'Admin User',    email: 'admin@example.com',    role: 'admin', isActive: true },
      { username: 'guedalia', password: 'password123', name: 'Guedalia Mahon', email: 'guedalia@example.com', role: 'user',  isActive: true },
      { username: 'alice',    password: 'password123', name: 'Alice Smith',   email: 'alice@example.com',    role: 'user',  isActive: true },
    ]);
    console.log(`Seeded ${users.length} users.`);
    const userMap = Object.fromEntries(users.map((u) => [u.username, u]));

    // ─── Todos ────────────────────────────────────────
    console.log('Seeding todos...');
    await Todo.create([
      { userId: userMap.guedalia._id, title: 'Complete Phase 6 of fullstack project', completed: false },
      { userId: userMap.guedalia._id, title: 'Review Mongoose models and controllers', completed: true },
      { userId: userMap.guedalia._id, title: 'Write project documentation', completed: false },
      { userId: userMap.alice._id,    title: 'Set up Vite + React development environment', completed: true },
      { userId: userMap.alice._id,    title: 'Implement unit testing with Jest', completed: false },
    ]);
    console.log('Seeded todos.');

    // ─── Posts ────────────────────────────────────────
    console.log('Seeding posts...');
    const posts = await Post.create([
      {
        userId: userMap.guedalia._id,
        title: 'The Future of Full-Stack Development',
        body: 'Full-stack development continues to evolve rapidly. With frameworks like React/Vite on the client and Express/Mongoose on the server, building modern, responsive, and secure web applications has never been more enjoyable.',
      },
      {
        userId: userMap.alice._id,
        title: 'Mastering React State Management',
        body: 'React hooks like useState, useEffect, and useContext provide a powerful foundation for managing component state. By isolating auth states and utilizing responsive layouts you can deliver an outstanding user experience.',
      },
    ]);
    console.log('Seeded posts.');
    const [post1, post2] = posts;

    // ─── Comments ─────────────────────────────────────
    console.log('Seeding comments...');
    await Comment.create([
      { postId: post1._id, userId: userMap.alice._id,    name: userMap.alice.username,    email: userMap.alice.email,    body: 'Excellent write-up! I completely agree that soft deletion is a crucial requirement for enterprise applications.' },
      { postId: post1._id, userId: userMap.admin._id,    name: userMap.admin.username,    email: userMap.admin.email,    body: 'Great article. Enforce proper indexing on references in MongoDB for fast query performance.' },
      { postId: post2._id, userId: userMap.guedalia._id, name: userMap.guedalia.username, email: userMap.guedalia.email, body: 'Very clean explanations on hooks. The useContext hook combined with Axios interceptors simplifies the auth flow.' },
    ]);
    console.log('Seeded comments.');

    // ─── Albums + Photos (1 album × 30 photos per user) ───
    console.log('Seeding albums and photos (1 album / 30 photos per user)...');
    let totalPhotos = 0;

    for (const { username, albumTitle, seeds } of USER_ALBUMS) {
      const owner = userMap[username];
      const album = await Album.create({ userId: owner._id, title: albumTitle });
      const photoDocs = seeds.map((seed, i) => ({
        albumId: album._id,
        ...makePhoto(seed, i, albumTitle),
      }));
      await Photo.insertMany(photoDocs);
      totalPhotos += photoDocs.length;
      console.log(`  ${username}: album "${albumTitle}" with ${photoDocs.length} photos`);
    }
    console.log(`Seeded 3 albums and ${totalPhotos} photos total.`);

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

seedData();
