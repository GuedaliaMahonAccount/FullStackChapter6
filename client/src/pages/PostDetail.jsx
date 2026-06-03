import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { postsAPI, commentsAPI } from '../api/api';
import Loader from '../components/Loader';
import '../styles/Posts.css';

/**
 * PostDetail Page
 * 
 * Displays a single post's details and its comments.
 * - Supports editing post title and body (if post owner or admin)
 * - Supports deleting the post (if post owner or admin)
 * - Displays comment list with author details
 * - Supports adding comments
 * - Supports editing and deleting comments (if comment owner or admin)
 */
const PostDetail = () => {
  const { username, postId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Post edit state
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [updatingPost, setUpdatingPost] = useState(false);

  // New comment state
  const [newCommentBody, setNewCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Comment edit state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentBody, setEditCommentBody] = useState('');

  // ─── Fetch Post & Comments ─────────────────────
  const fetchPostAndComments = useCallback(async () => {
    try {
      setLoading(true);
      const [postRes, commentsRes] = await Promise.all([
        postsAPI.getById(postId),
        postsAPI.getComments(postId),
      ]);
      setPost(postRes.data);
      setComments(commentsRes.data);
      setEditTitle(postRes.data.title);
      setEditBody(postRes.data.body);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load post.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPostAndComments();
  }, [fetchPostAndComments]);

  // ─── Ownership Helpers ─────────────────────────
  const isPostOwner = (p) => {
    if (!p || !user) return false;
    const authorId = typeof p.userId === 'object' ? p.userId._id : p.userId;
    return authorId === user._id || isAdmin;
  };

  const isCommentOwner = (c) => {
    if (!c || !user) return false;
    const authorId = typeof c.userId === 'object' ? c.userId._id : c.userId;
    return authorId === user._id || isAdmin;
  };

  const getAuthorName = (item) => {
    if (item.userId && typeof item.userId === 'object') {
      return item.userId.name || item.userId.username;
    }
    return item.name || 'Unknown';
  };

  const getAuthorEmail = (item) => {
    if (item.userId && typeof item.userId === 'object') {
      return item.userId.email || '';
    }
    return item.email || '';
  };

  const getAuthorInitial = (item) => {
    return getAuthorName(item).charAt(0).toUpperCase();
  };

  // ─── Post Actions ──────────────────────────────
  const handleUpdatePost = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editBody.trim()) return;

    setUpdatingPost(true);
    try {
      const { data } = await postsAPI.update(postId, {
        title: editTitle.trim(),
        body: editBody.trim(),
      });
      setPost(data);
      setIsEditingPost(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update post.');
    } finally {
      setUpdatingPost(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await postsAPI.delete(postId);
      navigate(`/users/${username}/posts`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete post.');
    }
  };

  // ─── Comment Actions ───────────────────────────
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentBody.trim()) return;

    setSubmittingComment(true);
    try {
      const { data } = await commentsAPI.create({
        postId,
        body: newCommentBody.trim(),
      });
      setComments((prev) => [...prev, data]);
      setNewCommentBody('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStartEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditCommentBody(comment.body);
  };

  const handleUpdateComment = async (commentId) => {
    if (!editCommentBody.trim()) return;

    try {
      const { data } = await commentsAPI.update(commentId, {
        body: editCommentBody.trim(),
      });
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? data : c))
      );
      setEditingCommentId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update comment.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentsAPI.delete(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete comment.');
    }
  };

  // ─── Render ────────────────────────────────────
  if (loading) return <Loader message="Loading post..." />;
  if (!post) {
    return (
      <div className="page-content">
        <div className="container" style={{ textAlign: 'center', paddingTop: 'var(--space-3xl)' }}>
          <h2>Post not found</h2>
          <Link to={`/users/${username}/posts`} className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>
            Back to Posts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container">
        <div className="post-detail">
          {/* Back Button */}
          <Link to={`/users/${username}/posts`} className="post-detail-back">
            ← Back to Posts
          </Link>

          {/* Error Message */}
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

          {/* Post Card or Edit Form */}
          {isEditingPost ? (
            <form onSubmit={handleUpdatePost} className="edit-post-form">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-title">Title</label>
                <input
                  id="edit-title"
                  type="text"
                  className="form-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-body">Body</label>
                <textarea
                  id="edit-body"
                  className="form-input form-textarea"
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  required
                  rows={6}
                />
              </div>
              <div className="create-post-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsEditingPost(false);
                    setEditTitle(post.title);
                    setEditBody(post.body);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updatingPost || !editTitle.trim() || !editBody.trim()}
                >
                  {updatingPost ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <article className="post-detail-card" id={`post-${post._id}`}>
              <h1 className="post-detail-title">{post.title}</h1>
              
              <div className="post-detail-meta">
                <span className="post-author-avatar">{getAuthorInitial(post)}</span>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {getAuthorName(post)}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    {getAuthorEmail(post)}
                  </div>
                </div>
              </div>

              <div className="post-detail-body">{post.body}</div>

              {isPostOwner(post) && (
                <div className="post-detail-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setIsEditingPost(true)}
                  >
                    Edit Post
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleDeletePost}
                  >
                    Delete Post
                  </button>
                </div>
              )}
            </article>
          )}

          {/* Comments Section */}
          <section className="comments-section">
            <div className="comments-header">
              <h2 className="comments-title">
                Comments <span className="comments-count">({comments.length})</span>
              </h2>
            </div>

            <div className="comment-list">
              {comments.map((comment) => (
                <div key={comment._id} className="comment-item" id={`comment-${comment._id}`}>
                  <div className="comment-header">
                    <div className="comment-author">
                      <span className="comment-author-avatar">{getAuthorInitial(comment)}</span>
                      <div>
                        <span className="comment-author-name">{getAuthorName(comment)}</span>
                        {getAuthorEmail(comment) && (
                          <span className="comment-author-email"> ({getAuthorEmail(comment)})</span>
                        )}
                      </div>
                    </div>

                    {isCommentOwner(comment) && editingCommentId !== comment._id && (
                      <div className="comment-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleStartEditComment(comment)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteComment(comment._id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {editingCommentId === comment._id ? (
                    <div style={{ marginTop: 'var(--space-sm)' }}>
                      <textarea
                        className="comment-edit-input"
                        value={editCommentBody}
                        onChange={(e) => setEditCommentBody(e.target.value)}
                        rows={3}
                        required
                      />
                      <div style={{ display: 'flex', gap: 'var(--space-xs)', marginTop: 'var(--space-xs)', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setEditingCommentId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleUpdateComment(comment._id)}
                          disabled={!editCommentBody.trim()}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="comment-body">{comment.body}</p>
                  )}
                </div>
              ))}

              {comments.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>
                  No comments yet.
                </div>
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="add-comment-form" id="add-comment-form">
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
                Add a comment
              </h3>
              <div className="form-group">
                <textarea
                  className="form-input form-textarea"
                  placeholder="Share your thoughts..."
                  value={newCommentBody}
                  onChange={(e) => setNewCommentBody(e.target.value)}
                  required
                  rows={3}
                />
              </div>
              <div className="add-comment-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingComment || !newCommentBody.trim()}
                >
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
