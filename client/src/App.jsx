import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';
import Login from './pages/Login';
import Register from './pages/Register';
import Todos from './pages/Todos';
import Posts from './pages/Posts';
import PostDetail from './pages/PostDetail';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

/**
 * App Component
 * 
 * Main application with routing.
 * Public routes: /login, /register
 * Protected routes: /users/:username/todos, /posts, /profile
 * Admin routes: /admin
 */
const App = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <Loader message="Loading application..." />;
  }

  return (
    <>
      {/* Navbar only shows when authenticated */}
      {isAuthenticated && <Navbar />}

      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated
              ? <Navigate to={`/users/${user?.username}/todos`} replace />
              : <Login />
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated
              ? <Navigate to={`/users/${user?.username}/todos`} replace />
              : <Register />
          }
        />

        {/* Protected Routes — Dynamic URLs with username */}
        <Route
          path="/users/:username/todos"
          element={
            <ProtectedRoute>
              <Todos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:username/posts"
          element={
            <ProtectedRoute>
              <Posts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:username/posts/:postId"
          element={
            <ProtectedRoute>
              <PostDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:username/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Admin Route */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* Catch-all: redirect to login or todos */}
        <Route
          path="*"
          element={
            isAuthenticated
              ? <Navigate to={`/users/${user?.username}/todos`} replace />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </>
  );
};

export default App;
