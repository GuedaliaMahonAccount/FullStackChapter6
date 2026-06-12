import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { postsAPI } from '../api/api';
import { getCached, setCached, invalidatePrefix } from '../cache/queryCache';
import Loader from '../components/Loader';
import '../styles/Posts.css';

const DEFAULT_LIMIT = 12;

const Posts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewStatus, setViewStatus] = useState('LOADING');
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', body: '' });
  const [mineOnly, setMineOnly] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const limit = user?.pageSize || DEFAULT_LIMIT;

  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    if (!append) setViewStatus('LOADING');
    try {
      const params = { page: pageNum, limit };
      if (mineOnly) params.mine = 'true';
      if (search) {
        if (search.match(/^[0-9a-f]{24}$/i)) params._id = search;
        else params.title = search;
      }

      const cacheKey = `posts:${mineOnly}:${search}:${pageNum}:${limit}`;
      if (!append) {
        const cached = getCached(cacheKey);
        if (cached) {
          setTotal(cached.total);
          setHasMore(cached.hasMore);
          setPosts(cached.posts);
          setViewStatus('SUCCESS');
          return;
        }
      }

      const { data: env } = await postsAPI.getAll(params);
      switch (env.status) {
        case 'SUCCESS': {
          const { posts: newPosts, total: t, hasMore: hm } = env.data;
          setTotal(t);
          setHasMore(hm);
          if (!append) setCached(cacheKey, env.data);
          setPosts((prev) => (append ? [...prev, ...newPosts] : newPosts));
          if (!append) setViewStatus('SUCCESS');
          break;
        }
        case 'NO_DATA':
          if (!append) { setPosts([]); setTotal(0); setHasMore(false); setViewStatus('NO_DATA'); }
          break;
        default:
          if (!append) setViewStatus(env.status || 'SERVER_ERROR');
      }
    } catch (err) {
      if (!append) setViewStatus(err.response?.data?.status || 'SERVER_ERROR');
    } finally {
      setLoadingMore(false);
    }
  }, [mineOnly, search, limit]);

  useEffect(() => { setPage(1); fetchPosts(1, false); }, [fetchPosts]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    await fetchPosts(nextPage, true);
  };

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput.trim()); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.body.trim()) return;
    setCreating(true);
    try {
      const { data: env } = await postsAPI.create({ title: newPost.title.trim(), body: newPost.body.trim() });
      if (env.status === 'CREATED') {
        setPosts((prev) => [env.data, ...prev]);
        setTotal((t) => t + 1);
        setViewStatus('SUCCESS');
        invalidatePrefix('posts:');
        setNewPost({ title: '', body: '' });
        setShowCreate(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e, postId) => {
    e.stopPropagation();
    try {
      const { data: env } = await postsAPI.delete(postId);
      if (env.status === 'DELETED') {
        const next = posts.filter((p) => p._id !== postId);
        setPosts(next);
        setTotal((t) => t - 1);
        if (next.length === 0) setViewStatus('NO_DATA');
        invalidatePrefix('posts:');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete post.');
    }
  };

  const goToPost = (post) => navigate(`/users/${user.username}/posts/${post._id}`);
  const getAuthorName = (post) => post.userId && typeof post.userId === 'object' ? post.userId.name || post.userId.username : 'Unknown';
  const getAuthorInitial = (post) => getAuthorName(post).charAt(0).toUpperCase();
  const isOwner = (post) => {
    const id = typeof post.userId === 'object' ? post.userId._id : post.userId;
    return id === user._id;
  };

  if (viewStatus === 'LOADING') return <Loader message="Loading posts..." />;

  return (
    <div className="page-content">
      <div className="container">
        <div className="posts-header">
          <h1 className="posts-title">Posts</h1>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <button className={`btn btn-sm ${mineOnly ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMineOnly((v) => !v)}>
              {mineOnly ? '✎ All Posts' : '◉ My Posts'}
            </button>
            <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)} id="toggle-create-post">
              {showCreate ? '✕ Cancel' : '+ New Post'}
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            ⚠ {error}
            <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <form className="posts-search-form" onSubmit={handleSearch}>
          <input type="text" className="form-input" placeholder="Search by title or post ID..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          <button type="submit" className="btn btn-secondary">Search</button>
          {search && <button type="button" className="btn btn-secondary" onClick={() => { setSearch(''); setSearchInput(''); }}>Clear</button>}
        </form>

        {showCreate && (
          <form className="create-post-form" onSubmit={handleCreate} id="create-post-form">
            <div className="form-group">
              <label className="form-label" htmlFor="post-title">Title</label>
              <input id="post-title" type="text" className="form-input" placeholder="Post title..." value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="post-body">Body</label>
              <textarea id="post-body" className="form-input form-textarea" placeholder="Write your post..." value={newPost.body} onChange={(e) => setNewPost({ ...newPost, body: e.target.value })} required rows={4} />
            </div>
            <div className="create-post-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={creating || !newPost.title.trim() || !newPost.body.trim()} id="submit-post">
                {creating ? 'Publishing...' : 'Publish Post'}
              </button>
            </div>
          </form>
        )}

        {/* Content area — driven by viewStatus */}
        {viewStatus === 'NO_DATA' && (
          <div className="posts-empty">
            <p style={{ fontSize: '3rem', marginBottom: 'var(--space-md)', opacity: 0.5 }}>✎</p>
            <p>{mineOnly ? "You haven't written any posts yet." : 'No posts found.'}</p>
          </div>
        )}

        {viewStatus === 'SERVER_ERROR' && (
          <div className="posts-empty"><p>Failed to load posts. Please try again.</p></div>
        )}

        {viewStatus === 'SUCCESS' && (
          <>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-lg)' }}>
              {total} post{total !== 1 ? 's' : ''}
            </p>
            <div className="posts-grid">
              {posts.map((post) => (
                <div key={post._id} className="post-card" onClick={() => goToPost(post)} id={`post-${post._id}`}>
                  <div className="post-card-header"><h2 className="post-card-title">{post.title}</h2></div>
                  <p className="post-card-body">{post.body}</p>
                  <div className="post-card-footer">
                    <div className="post-author">
                      <span className="post-author-avatar">{getAuthorInitial(post)}</span>
                      <span>{getAuthorName(post)}</span>
                    </div>
                    <div className="post-card-actions">
                      {isOwner(post) && (
                        <>
                          <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); goToPost(post); }}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={(e) => handleDelete(e, post._id)}>Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="load-more-container">
                <button className="btn btn-secondary load-more-btn" onClick={handleLoadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Posts;
