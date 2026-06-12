import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { postsAPI, commentsAPI } from '../api/api';
import Loader from '../components/Loader';
import '../styles/Posts.css';

const PostDetail = () => {
  const { username, postId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [postStatus, setPostStatus] = useState('LOADING');
  const [commentsStatus, setCommentsStatus] = useState('LOADING');
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');

  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [updatingPost, setUpdatingPost] = useState(false);

  const [newCommentBody, setNewCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentBody, setEditCommentBody] = useState('');

  const fetchPostAndComments = useCallback(async () => {
    setPostStatus('LOADING');
    setCommentsStatus('LOADING');

    const [postResult, commentsResult] = await Promise.allSettled([
      postsAPI.getById(postId),
      postsAPI.getComments(postId),
    ]);

    if (postResult.status === 'fulfilled') {
      const env = postResult.value.data;
      if (env.status === 'SUCCESS') {
        setPost(env.data);
        setEditTitle(env.data.title);
        setEditBody(env.data.body);
      }
      setPostStatus(env.status);
    } else {
      setPostStatus(postResult.reason?.response?.data?.status || 'SERVER_ERROR');
    }

    if (commentsResult.status === 'fulfilled') {
      const env = commentsResult.value.data;
      setComments(env.status === 'SUCCESS' ? env.data : []);
      setCommentsStatus(env.status);
    } else {
      setComments([]);
      setCommentsStatus(commentsResult.reason?.response?.data?.status || 'SERVER_ERROR');
    }
  }, [postId]);

  useEffect(() => { fetchPostAndComments(); }, [fetchPostAndComments]);

  const isPostOwner    = (p) => { if (!p || !user) return false; const id = typeof p.userId === 'object' ? p.userId._id : p.userId; return id === user._id || isAdmin; };
  const isCommentOwner = (c) => { if (!c || !user) return false; const id = typeof c.userId === 'object' ? c.userId._id : c.userId; return id === user._id || isAdmin; };
  const getAuthorName  = (item) => item.userId && typeof item.userId === 'object' ? item.userId.name || item.userId.username : item.name || 'Unknown';
  const getAuthorEmail = (item) => item.userId && typeof item.userId === 'object' ? item.userId.email || '' : item.email || '';
  const getAuthorInitial = (item) => getAuthorName(item).charAt(0).toUpperCase();

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editBody.trim()) return;
    setUpdatingPost(true);
    try {
      const { data: env } = await postsAPI.update(postId, { title: editTitle.trim(), body: editBody.trim() });
      if (env.status === 'UPDATED') { setPost(env.data); setIsEditingPost(false); }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update post.');
    } finally {
      setUpdatingPost(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const { data: env } = await postsAPI.delete(postId);
      if (env.status === 'DELETED') navigate(`/users/${username}/posts`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete post.');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentBody.trim()) return;
    setSubmittingComment(true);
    try {
      const { data: env } = await commentsAPI.create({ postId, body: newCommentBody.trim() });
      if (env.status === 'CREATED') {
        setComments((prev) => [...prev, env.data]);
        setCommentsStatus('SUCCESS');
        setNewCommentBody('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStartEditComment = (comment) => { setEditingCommentId(comment._id); setEditCommentBody(comment.body); };

  const handleUpdateComment = async (commentId) => {
    if (!editCommentBody.trim()) return;
    try {
      const { data: env } = await commentsAPI.update(commentId, { body: editCommentBody.trim() });
      if (env.status === 'UPDATED') {
        setComments((prev) => prev.map((c) => (c._id === commentId ? env.data : c)));
        setEditingCommentId(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update comment.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      const { data: env } = await commentsAPI.delete(commentId);
      if (env.status === 'DELETED') {
        const next = comments.filter((c) => c._id !== commentId);
        setComments(next);
        if (next.length === 0) setCommentsStatus('NO_DATA');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete comment.');
    }
  };

  if (postStatus === 'LOADING') return <Loader message="Loading post..." />;

  if (postStatus === 'NOT_FOUND') {
    return (
      <div className="page-content">
        <div className="container" style={{ textAlign: 'center', paddingTop: 'var(--space-3xl)' }}>
          <h2>Post not found</h2>
          <Link to={`/users/${username}/posts`} className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>Back to Posts</Link>
        </div>
      </div>
    );
  }

  if (postStatus !== 'SUCCESS') {
    return (
      <div className="page-content">
        <div className="container" style={{ textAlign: 'center', paddingTop: 'var(--space-3xl)' }}>
          <h2>Something went wrong</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>Could not load this post. Please try again.</p>
          <Link to={`/users/${username}/posts`} className="btn btn-secondary" style={{ marginTop: 'var(--space-md)' }}>Back to Posts</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container">
        <div className="post-detail">
          <Link to={`/users/${username}/posts`} className="post-detail-back">← Back to Posts</Link>

          {error && (
            <div className="alert alert-error">
              ⚠ {error}
              <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
            </div>
          )}

          {isEditingPost ? (
            <form onSubmit={handleUpdatePost} className="edit-post-form">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-title">Title</label>
                <input id="edit-title" type="text" className="form-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-body">Body</label>
                <textarea id="edit-body" className="form-input form-textarea" value={editBody} onChange={(e) => setEditBody(e.target.value)} required rows={6} />
              </div>
              <div className="create-post-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setIsEditingPost(false); setEditTitle(post.title); setEditBody(post.body); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={updatingPost || !editTitle.trim() || !editBody.trim()}>
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
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{getAuthorName(post)}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{getAuthorEmail(post)}</div>
                </div>
              </div>
              <div className="post-detail-body">{post.body}</div>
              {isPostOwner(post) && (
                <div className="post-detail-actions">
                  <button className="btn btn-secondary" onClick={() => setIsEditingPost(true)}>Edit Post</button>
                  <button className="btn btn-danger" onClick={handleDeletePost}>Delete Post</button>
                </div>
              )}
            </article>
          )}

          <section className="comments-section">
            <div className="comments-header">
              <h2 className="comments-title">
                Comments <span className="comments-count">({comments.length})</span>
              </h2>
            </div>

            <div className="comment-list">
              {commentsStatus === 'LOADING' && <Loader message="Loading comments..." />}

              {commentsStatus === 'NO_DATA' && (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>
                  No comments yet. Be the first!
                </div>
              )}

              {commentsStatus === 'SUCCESS' && comments.map((comment) => (
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
                        <button className="btn btn-sm btn-secondary" onClick={() => handleStartEditComment(comment)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteComment(comment._id)}>Delete</button>
                      </div>
                    )}
                  </div>

                  {editingCommentId === comment._id ? (
                    <div style={{ marginTop: 'var(--space-sm)' }}>
                      <textarea className="comment-edit-input" value={editCommentBody} onChange={(e) => setEditCommentBody(e.target.value)} rows={3} required />
                      <div style={{ display: 'flex', gap: 'var(--space-xs)', marginTop: 'var(--space-xs)', justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => setEditingCommentId(null)}>Cancel</button>
                        <button className="btn btn-sm btn-primary" onClick={() => handleUpdateComment(comment._id)} disabled={!editCommentBody.trim()}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <p className="comment-body">{comment.body}</p>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="add-comment-form" id="add-comment-form">
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Add a comment</h3>
              <div className="form-group">
                <textarea className="form-input form-textarea" placeholder="Share your thoughts..." value={newCommentBody} onChange={(e) => setNewCommentBody(e.target.value)} required rows={3} />
              </div>
              <div className="add-comment-actions">
                <button type="submit" className="btn btn-primary" disabled={submittingComment || !newCommentBody.trim()}>
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
