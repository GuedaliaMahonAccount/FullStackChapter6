import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Todos from './pages/Todos';
import Posts from './pages/Posts';
import PostDetail from './pages/PostDetail';
import Albums from './pages/Albums';
import AlbumDetail from './pages/AlbumDetail';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

const App = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <Loader message="Loading application..." />;

  return (
    <>
      {isAuthenticated && <Navbar />}

      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to={`/users/${user?.username}/dashboard`} replace /> : <Login />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to={`/users/${user?.username}/dashboard`} replace /> : <Register />}
        />

        {/* Protected Routes */}
        <Route path="/users/:username/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/users/:username/todos" element={<ProtectedRoute><Todos /></ProtectedRoute>} />
        <Route path="/users/:username/posts" element={<ProtectedRoute><Posts /></ProtectedRoute>} />
        <Route path="/users/:username/posts/:postId" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
        <Route path="/users/:username/albums" element={<ProtectedRoute><Albums /></ProtectedRoute>} />
        <Route path="/users/:username/albums/:albumId" element={<ProtectedRoute><AlbumDetail /></ProtectedRoute>} />
        <Route path="/users/:username/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Admin Route */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route
          path="*"
          element={
            isAuthenticated
              ? <Navigate to={`/users/${user?.username}/dashboard`} replace />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </>
  );
};

export default App;
