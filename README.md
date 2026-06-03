# JSONPlaceholder Full-Stack Clone

A premium full-stack REST API and React Client mimicking the capabilities of `jsonplaceholder.typicode.com`, designed and implemented for modern, fast, and secure web experiences.

**Project Author**: Guedalia

---

## 🚀 Features

### Frontend (React Client)
- **State-of-the-Art Aesthetic**: A responsive dark-mode interface using glassmorphism, dynamic gradients, and custom animations.
- **Authentication System**: Secure JWT-based registration, login, and token expiry handling.
- **Full Todos Management**: Complete CRUD operations with client-side filters (All/Active/Completed) and live progress stats.
- **Posts & Nested Comments**: Complete blog-like functionality with user author avatars, inline editing, and comments management.
- **Admin Panel**: Role-based routing that provides user management, account blocking, and dynamic role reassignment.
- **Profile Center**: Self-profile edits and secure password change validation.

### Backend (Node.js + Express)
- **RESTful Endpoints**: Complete set of routes following JSONPlaceholder resource structures.
- **MongoDB Connection**: Structured database modeling using Mongoose schemas.
- **Soft Deletion**: Transparent deletion mechanism using `isDeleted` flags rather than dropping documents.
- **Ownership Middleware**: Route-level middleware to enforce resource ownership checks.
- **Robust Error Handling**: Centralized error middleware with standard HTTP responses.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite, React Router DOM, Axios, Context API, Vanilla CSS)
- **Backend**: Node.js, Express
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JSON Web Tokens (JWT), Bcrypt (Password Hashing)

---

## 📁 Repository Structure

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── api/            # Axios API client setup
│   │   ├── components/     # Reusable components (Navbar, Loader, Modals)
│   │   ├── context/        # React AuthContext
│   │   ├── hooks/          # React hooks (useAuth)
│   │   ├── pages/          # Page components (Login, Register, Todos, Posts, PostDetail, Profile, Admin)
│   │   ├── styles/         # CSS design stylesheets
│   │   └── App.jsx         # App routing tree
│   └── package.json
│
└── server/                 # Express backend application
    ├── config/             # Database connection setups
    ├── controllers/        # Business logic controllers
    ├── middleware/         # Auth, admin, ownership, and error handlers
    ├── models/             # Mongoose Schemas (User, Todo, Post, Comment)
    ├── routes/             # Route definitions
    ├── seed.js             # DB Seeding script
    └── package.json
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas URI

### 1. Backend Setup
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the environment variables in a `.env` file:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/jsonplaceholder
   JWT_SECRET=your_secret_key_here
   JWT_EXPIRES_IN=7d
   ```
4. Seed the database with mock users, posts, and comments:
   ```bash
   npm run seed
   ```
5. Start the backend dev server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the `client` directory:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 🔌 API Routes Reference

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/auth/register` | Public | Register a new user |
| **POST** | `/auth/login` | Public | Authenticate a user and return JWT |
| **GET** | `/users` | Admin | Get list of all users |
| **PUT** | `/users/:id` | Owner/Admin | Update user details (name, email) |
| **PUT** | `/users/:id/password` | Owner | Change user password |
| **PATCH** | `/users/:id/block` | Admin | Toggle block status (`isActive`) |
| **GET** | `/todos` | Owner/Admin | List user's todos |
| **POST** | `/todos` | Authenticated | Create a new todo |
| **PUT** | `/todos/:id` | Owner/Admin | Update todo details (title, completed) |
| **DELETE**| `/todos/:id` | Owner/Admin | Soft delete todo |
| **GET** | `/posts` | Authenticated | List all active posts |
| **GET** | `/posts/:id` | Authenticated | Get details of a single post |
| **POST** | `/posts` | Authenticated | Create a new post |
| **PUT** | `/posts/:id` | Owner/Admin | Update post details |
| **DELETE**| `/posts/:id` | Owner/Admin | Soft delete post |
| **GET** | `/posts/:id/comments` | Authenticated | List comments for a post |
| **POST** | `/comments` | Authenticated | Add a comment to a post |
| **PUT** | `/comments/:id` | Owner/Admin | Update comment body |
| **DELETE**| `/comments/:id` | Owner/Admin | Soft delete comment |

---

## 🤝 Seeded Accounts

To explore the application directly, seed the database and use one of the following accounts:

1. **Admin Account**
   - **Username**: `admin`
   - **Password**: `password123`

2. **Regular User Account**
   - **Username**: `guedalia`
   - **Password**: `password123`