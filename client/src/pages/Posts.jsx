import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { postsAPI } from '../api/api';
import Loader from '../components/Loader';
import '../styles/Posts.css';

/**
 * Posts Page
 * 
 * Displays all posts in a card grid.
 * - Create new post via expandable form
 * - Click a post card to navigate to PostDetail
 * - Edit/Delete buttons shown only for posts owned by the current user
 */
const Posts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', body: '' });

  // ─── Fetch Posts ──────────────────────────────
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await postsAPI.getAll();
        setPosts(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch posts.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // ─── Create Post ──────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.body.trim()) return;

    setCreating(true);
    try {
      const { data } = await postsAPI.create({
        title: newPost.title.trim(),
        body: newPost.body.trim(),
      });
      setPosts((prev) => [data, ...prev]);
      setNewPost({ title: '', body: '' });
      setShowCreate(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post.');
    } finally {
      setCreating(false);
    }
  };

  // ─── Delete Post ──────────────────────────────
  const handleDelete = async (e, postId) => {
    e.stopPropagation(); // Don't navigate to detail
    try {
      await postsAPI.delete(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete post.');
    }
  };

  // ─── Navigate to Detail ───────────────────────
  const goToPost = (post) => {
    navigate(`/users/${user.username}/posts/${post._id}`);
  };

  // ─── Get author name from populated userId ────
  const getAuthorName = (post) => {
    if (post.userId && typeof post.userId === 'object') {
      return post.userId.name || post.userId.username;
    }
    return 'Unknown';
  };

  const getAuthorInitial = (post) => {
    return getAuthorName(post).charAt(0).toUpperCase();
  };

  const isOwner = (post) => {
    const postUserId = typeof post.userId === 'object' ? post.userId._id : post.userId;
    return postUserId === user._id;
  };

  // ─── Render ───────────────────────────────────
  if (loading) return <Loader message="Loading posts..." />;

  return (
    <div className="page-content">
      <div className="container">
        {/* Header */}
        <div className="posts-header">
          <h1 className="posts-title">Posts</h1>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreate(!showCreate)}
            id="toggle-create-post"
          >
            {showCreate ? '✕ Cancel' : '+ New Post'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error">
            ⚠ {error}
            <button
              onClick={() => setError('')}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Create Post Form */}
        {showCreate && (
          <form className="create-post-form" onSubmit={handleCreate} id="create-post-form">
            <div className="form-group">
              <label className="form-label" htmlFor="post-title">Title</label>
              <input
                id="post-title"
                type="text"
                className="form-input"
                placeholder="Post title..."
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="post-body">Body</label>
              <textarea
                id="post-body"
                className="form-input form-textarea"
                placeholder="Write your post..."
                value={newPost.body}
                onChange={(e) => setNewPost({ ...newPost, body: e.target.value })}
                required
                rows={4}
              />
            </div>
            <div className="create-post-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={creating || !newPost.title.trim() || !newPost.body.trim()}
                id="submit-post"
              >
                {creating ? 'Publishing...' : 'Publish Post'}
              </button>
            </div>
          </form>
        )}

        {/* Posts Grid */}
        <div className="posts-grid">
          {posts.length === 0 ? (
            <div className="posts-empty">
              <p style={{ fontSize: '3rem', marginBottom: 'var(--space-md)', opacity: 0.5 }}>✎</p>
              <p>No posts yet. Be the first to write one!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post._id}
                className="post-card"
                onClick={() => goToPost(post)}
                id={`post-${post._id}`}
              >
                <div className="post-card-header">
                  <h2 className="post-card-title">{post.title}</h2>
                </div>
                <p className="post-card-body">{post.body}</p>
                <div className="post-card-footer">
                  <div className="post-author">
                    <span className="post-author-avatar">{getAuthorInitial(post)}</span>
                    <span>{getAuthorName(post)}</span>
                  </div>
                  <div className="post-card-actions">
                    {isOwner(post) && (
                      <>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToPost(post);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={(e) => handleDelete(e, post._id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Posts;
