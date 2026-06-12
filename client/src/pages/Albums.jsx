import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { albumsAPI } from '../api/api';
import { getCached, setCached, invalidatePrefix } from '../cache/queryCache';
import Loader from '../components/Loader';
import '../styles/Albums.css';

const DEFAULT_LIMIT = 12;

const Albums = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewStatus, setViewStatus] = useState('LOADING');
  const [albums, setAlbums] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [mineOnly, setMineOnly] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const limit = user?.pageSize || DEFAULT_LIMIT;

  const fetchAlbums = useCallback(async (pageNum = 1, append = false) => {
    if (!append) setViewStatus('LOADING');
    try {
      const params = { page: pageNum, limit };
      if (mineOnly) params.mine = 'true';
      if (search) params.title = search;

      const cacheKey = `albums:${mineOnly}:${search}:${pageNum}:${limit}`;
      if (!append) {
        const cached = getCached(cacheKey);
        if (cached) {
          setTotal(cached.total);
          setHasMore(cached.hasMore);
          setAlbums(cached.albums);
          setViewStatus('SUCCESS');
          return;
        }
      }

      const { data: env } = await albumsAPI.getAll(params);
      switch (env.status) {
        case 'SUCCESS': {
          const { albums: newAlbums, total: t, hasMore: hm } = env.data;
          setTotal(t);
          setHasMore(hm);
          if (!append) setCached(cacheKey, env.data);
          setAlbums((prev) => (append ? [...prev, ...newAlbums] : newAlbums));
          if (!append) setViewStatus('SUCCESS');
          break;
        }
        case 'NO_DATA':
          if (!append) { setAlbums([]); setTotal(0); setHasMore(false); setViewStatus('NO_DATA'); }
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

  useEffect(() => { setPage(1); fetchAlbums(1, false); }, [fetchAlbums]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    await fetchAlbums(nextPage, true);
  };

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput.trim()); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const { data: env } = await albumsAPI.create({ title: newTitle.trim() });
      if (env.status === 'CREATED') {
        setAlbums((prev) => [env.data, ...prev]);
        setTotal((t) => t + 1);
        setViewStatus('SUCCESS');
        invalidatePrefix('albums:');
        setNewTitle('');
        setShowCreate(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create album.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e, albumId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this album and all its photos?')) return;
    try {
      const { data: env } = await albumsAPI.delete(albumId);
      if (env.status === 'DELETED') {
        const next = albums.filter((a) => a._id !== albumId);
        setAlbums(next);
        setTotal((t) => t - 1);
        if (next.length === 0) setViewStatus('NO_DATA');
        invalidatePrefix('albums:');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete album.');
    }
  };

  const isOwner = (album) => {
    const id = typeof album.userId === 'object' ? album.userId._id : album.userId;
    return id === user._id || user.role === 'admin';
  };

  const getAuthorName = (album) =>
    album.userId && typeof album.userId === 'object' ? album.userId.name || album.userId.username : 'Unknown';

  if (viewStatus === 'LOADING') return <Loader message="Loading albums..." />;

  return (
    <div className="page-content">
      <div className="container">
        <div className="albums-header">
          <h1 className="albums-title">Albums</h1>
          <div className="albums-header-actions">
            <button className={`btn btn-sm ${mineOnly ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMineOnly((v) => !v)}>
              {mineOnly ? '⊞ All Albums' : '◉ My Albums'}
            </button>
            <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
              {showCreate ? '✕ Cancel' : '+ New Album'}
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            ⚠ {error}
            <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <form className="albums-search-form" onSubmit={handleSearch}>
          <input type="text" className="form-input" placeholder="Search albums by title..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          <button type="submit" className="btn btn-secondary">Search</button>
          {search && <button type="button" className="btn btn-secondary" onClick={() => { setSearch(''); setSearchInput(''); }}>Clear</button>}
        </form>

        {showCreate && (
          <form className="albums-create-form" onSubmit={handleCreate}>
            <input type="text" className="form-input" placeholder="Album title..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} autoFocus required />
            <button type="submit" className="btn btn-primary" disabled={creating || !newTitle.trim()}>
              {creating ? 'Creating...' : 'Create Album'}
            </button>
          </form>
        )}

        {/* Content area — driven by viewStatus */}
        {viewStatus === 'NO_DATA' && (
          <div className="albums-empty">
            <div style={{ fontSize: '3rem', opacity: 0.4 }}>⊞</div>
            <p>{mineOnly ? "You don't have any albums yet." : 'No albums found.'}</p>
          </div>
        )}

        {viewStatus === 'SERVER_ERROR' && (
          <div className="albums-empty"><p>Failed to load albums. Please try again.</p></div>
        )}

        {viewStatus === 'SUCCESS' && (
          <>
            <p className="albums-count-text">{total} album{total !== 1 ? 's' : ''}</p>
            <div className="albums-grid">
              {albums.map((album) => (
                <div key={album._id} className="album-card" onClick={() => navigate(`/users/${user.username}/albums/${album._id}`)}>
                  <div className="album-card-cover">⊞</div>
                  <div className="album-card-body">
                    <h3 className="album-card-title">{album.title}</h3>
                    <div className="album-card-meta">by {getAuthorName(album)}</div>
                  </div>
                  {isOwner(album) && (
                    <button className="btn btn-sm btn-danger album-delete-btn" onClick={(e) => handleDelete(e, album._id)} title="Delete album">🗑</button>
                  )}
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

export default Albums;
