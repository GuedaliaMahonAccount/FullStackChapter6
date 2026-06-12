import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { albumsAPI } from '../api/api';
import { getCached, setCached, invalidatePrefix } from '../cache/queryCache';
import Loader from '../components/Loader';
import '../styles/Albums.css';

const DEFAULT_LIMIT = 12;

const AlbumDetail = () => {
  const { username, albumId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [albumStatus, setAlbumStatus] = useState('LOADING');
  const [photosStatus, setPhotosStatus] = useState('LOADING');
  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [photoTotal, setPhotoTotal] = useState(0);
  const [photoPage, setPhotoPage] = useState(1);
  const [hasMorePhotos, setHasMorePhotos] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [newPhoto, setNewPhoto] = useState({ title: '', url: '', thumbnailUrl: '' });
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const limit = user?.pageSize || DEFAULT_LIMIT;

  // Fetch album metadata
  useEffect(() => {
    setAlbumStatus('LOADING');
    const cacheKey = `album:${albumId}`;
    const cached = getCached(cacheKey);
    if (cached) { setAlbum(cached); setAlbumStatus('SUCCESS'); return; }

    albumsAPI.getById(albumId)
      .then(({ data: env }) => {
        if (env.status === 'SUCCESS') { setAlbum(env.data); setCached(cacheKey, env.data); }
        setAlbumStatus(env.status);
      })
      .catch((err) => setAlbumStatus(err.response?.data?.status || 'SERVER_ERROR'));
  }, [albumId]);

  // Fetch paginated photos
  const fetchPhotos = useCallback(async (pageNum = 1, append = false) => {
    if (!append) setPhotosStatus('LOADING');
    try {
      const cacheKey = `albumPhotos:${albumId}:${pageNum}:${limit}`;
      if (!append) {
        const cached = getCached(cacheKey);
        if (cached) {
          setPhotoTotal(cached.total);
          setHasMorePhotos(cached.hasMore);
          setPhotos(cached.photos);
          setPhotosStatus('SUCCESS');
          return;
        }
      }

      const { data: env } = await albumsAPI.getPhotos(albumId, { page: pageNum, limit });
      switch (env.status) {
        case 'SUCCESS': {
          const { photos: newPhotos, total: t, hasMore: hm } = env.data;
          setPhotoTotal(t);
          setHasMorePhotos(hm);
          if (!append) setCached(cacheKey, env.data);
          setPhotos((prev) => (append ? [...prev, ...newPhotos] : newPhotos));
          if (!append) setPhotosStatus('SUCCESS');
          break;
        }
        case 'NO_DATA':
          if (!append) { setPhotos([]); setPhotoTotal(0); setHasMorePhotos(false); setPhotosStatus('NO_DATA'); }
          break;
        default:
          if (!append) setPhotosStatus(env.status || 'SERVER_ERROR');
      }
    } catch (err) {
      if (!append) setPhotosStatus(err.response?.data?.status || 'SERVER_ERROR');
    } finally {
      setLoadingMore(false);
    }
  }, [albumId, limit]);

  useEffect(() => { setPhotoPage(1); fetchPhotos(1, false); }, [fetchPhotos]);

  const handleLoadMorePhotos = async () => {
    const next = photoPage + 1;
    setPhotoPage(next);
    setLoadingMore(true);
    await fetchPhotos(next, true);
  };

  const isOwner = (a) => {
    if (!a) return false;
    const id = typeof a.userId === 'object' ? a.userId._id : a.userId;
    return id === user._id || user.role === 'admin';
  };

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!newPhoto.title.trim() || !newPhoto.url.trim()) return;
    setAddingPhoto(true);
    try {
      const { data: env } = await albumsAPI.addPhoto(albumId, {
        title: newPhoto.title.trim(),
        url: newPhoto.url.trim(),
        thumbnailUrl: newPhoto.thumbnailUrl.trim() || undefined,
      });
      if (env.status === 'CREATED') {
        setPhotos((prev) => [...prev, env.data]);
        setPhotoTotal((t) => t + 1);
        setPhotosStatus('SUCCESS');
        invalidatePrefix(`albumPhotos:${albumId}`);
        setNewPhoto({ title: '', url: '', thumbnailUrl: '' });
        setShowAddPhoto(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add photo.');
    } finally {
      setAddingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Delete this photo?')) return;
    try {
      const { data: env } = await albumsAPI.deletePhoto(albumId, photoId);
      if (env.status === 'DELETED') {
        const next = photos.filter((p) => p._id !== photoId);
        setPhotos(next);
        setPhotoTotal((t) => t - 1);
        if (next.length === 0) setPhotosStatus('NO_DATA');
        invalidatePrefix(`albumPhotos:${albumId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete photo.');
    }
  };

  const handleDeleteAlbum = async () => {
    if (!window.confirm('Delete this entire album and all its photos?')) return;
    try {
      const { data: env } = await albumsAPI.delete(albumId);
      if (env.status === 'DELETED') {
        invalidatePrefix(`album:${albumId}`);
        invalidatePrefix('albums:');
        navigate(`/users/${username}/albums`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete album.');
    }
  };

  const generatePicsumUrl = () => {
    const seed = `photo${Date.now()}`;
    setNewPhoto((p) => ({ ...p, url: `https://picsum.photos/seed/${seed}/600/400`, thumbnailUrl: `https://picsum.photos/seed/${seed}/150/150` }));
  };

  if (albumStatus === 'LOADING') return <Loader message="Loading album..." />;

  if (albumStatus === 'NOT_FOUND') {
    return (
      <div className="page-content">
        <div className="container" style={{ textAlign: 'center', paddingTop: 'var(--space-3xl)' }}>
          <h2>Album not found</h2>
          <Link to={`/users/${username}/albums`} className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>Back to Albums</Link>
        </div>
      </div>
    );
  }

  if (albumStatus !== 'SUCCESS') {
    return (
      <div className="page-content">
        <div className="container" style={{ textAlign: 'center', paddingTop: 'var(--space-3xl)' }}>
          <h2>Something went wrong</h2>
          <Link to={`/users/${username}/albums`} className="btn btn-secondary" style={{ marginTop: 'var(--space-md)' }}>Back to Albums</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container">
        <Link to={`/users/${username}/albums`} className="post-detail-back">← Back to Albums</Link>

        {error && (
          <div className="alert alert-error">
            ⚠ {error}
            <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <div className="album-detail-header">
          <div>
            <h1 className="album-detail-title">{album.title}</h1>
            <p className="album-detail-meta">
              by {album.userId?.name || album.userId?.username || 'Unknown'} · {photoTotal} photo{photoTotal !== 1 ? 's' : ''}
            </p>
          </div>
          {isOwner(album) && (
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button className="btn btn-primary" onClick={() => setShowAddPhoto(!showAddPhoto)}>
                {showAddPhoto ? '✕ Cancel' : '+ Add Photo'}
              </button>
              <button className="btn btn-danger" onClick={handleDeleteAlbum}>Delete Album</button>
            </div>
          )}
        </div>

        {showAddPhoto && (
          <form className="add-photo-form" onSubmit={handleAddPhoto}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input type="text" className="form-input" placeholder="Photo title..." value={newPhoto.title} onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Image URL *</label>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <input type="url" className="form-input" placeholder="https://picsum.photos/seed/photo1/600/400" value={newPhoto.url} onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })} required />
                <button type="button" className="btn btn-secondary" onClick={generatePicsumUrl} style={{ whiteSpace: 'nowrap' }}>Random Picsum</button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Thumbnail URL (optional)</label>
              <input type="url" className="form-input" placeholder="Auto-generated if blank" value={newPhoto.thumbnailUrl} onChange={(e) => setNewPhoto({ ...newPhoto, thumbnailUrl: e.target.value })} />
            </div>
            {newPhoto.url && (
              <div className="photo-preview">
                <img src={newPhoto.url} alt="preview" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddPhoto(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={addingPhoto || !newPhoto.title.trim() || !newPhoto.url.trim()}>
                {addingPhoto ? 'Adding...' : 'Add Photo'}
              </button>
            </div>
          </form>
        )}

        {/* Photos — driven by photosStatus */}
        {photosStatus === 'LOADING' && <Loader message="Loading photos..." />}

        {photosStatus === 'NO_DATA' && (
          <div className="photos-empty">
            <div style={{ fontSize: '3rem', opacity: 0.4 }}>🖼</div>
            <p>No photos yet.{isOwner(album) ? ' Add one above!' : ''}</p>
          </div>
        )}

        {photosStatus === 'SUCCESS' && (
          <>
            <div className="photos-grid">
              {photos.map((photo) => (
                <div key={photo._id} className="photo-card" onClick={() => setLightbox(photo)}>
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.title}
                    className="photo-thumbnail"
                    loading="lazy"
                    onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect fill="%23eee" width="150" height="150"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999">No image</text></svg>'; }}
                  />
                  <div className="photo-card-footer">
                    <span className="photo-title">{photo.title}</span>
                    {isOwner(album) && (
                      <button className="btn btn-sm btn-danger photo-delete-btn" onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo._id); }} title="Delete photo">🗑</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {hasMorePhotos && (
              <div className="load-more-container">
                <button className="btn btn-secondary load-more-btn" onClick={handleLoadMorePhotos} disabled={loadingMore}>
                  {loadingMore ? 'Loading...' : `Load More (${photoTotal - photos.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}

        {lightbox && (
          <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
              <img src={lightbox.url} alt={lightbox.title} className="lightbox-img" />
              <p className="lightbox-caption">{lightbox.title}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlbumDetail;
