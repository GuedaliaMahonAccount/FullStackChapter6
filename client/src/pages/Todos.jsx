import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { todosAPI } from '../api/api';
import { getCached, setCached, invalidatePrefix } from '../cache/queryCache';
import Loader from '../components/Loader';
import '../styles/Todos.css';

const Todos = () => {
  const { user } = useAuth();
  const [viewStatus, setViewStatus] = useState('LOADING');
  const [todos, setTodos] = useState([]);
  const [error, setError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput.trim()); };

  const fetchTodos = useCallback(async () => {
    setViewStatus('LOADING');
    try {
      const params = {};
      if (filter === 'active')    params.completed = 'false';
      if (filter === 'completed') params.completed = 'true';
      if (search) {
        if (search.match(/^[0-9a-f]{24}$/i)) params._id = search;
        else params.title = search;
      }

      const cacheKey = `todos:${user._id}:${filter}:${search}`;
      const cached = getCached(cacheKey);
      if (cached) { setTodos(cached); setViewStatus('SUCCESS'); return; }

      const { data: env } = await todosAPI.getAll(params);
      switch (env.status) {
        case 'SUCCESS':
          setTodos(env.data);
          setCached(cacheKey, env.data);
          setViewStatus('SUCCESS');
          break;
        case 'NO_DATA':
          setTodos([]);
          setViewStatus('NO_DATA');
          break;
        default:
          setViewStatus(env.status || 'SERVER_ERROR');
      }
    } catch (err) {
      setViewStatus(err.response?.data?.status || 'SERVER_ERROR');
    }
  }, [filter, search, user._id]);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const { data: env } = await todosAPI.create({ title: newTitle.trim() });
      if (env.status === 'CREATED') {
        setTodos((prev) => [...prev, env.data]);
        setViewStatus('SUCCESS');
        invalidatePrefix(`todos:${user._id}`);
        setNewTitle('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create todo.');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (todo) => {
    try {
      const { data: env } = await todosAPI.update(todo._id, { completed: !todo.completed });
      if (env.status === 'UPDATED') {
        setTodos((prev) => prev.map((t) => (t._id === env.data._id ? env.data : t)));
        invalidatePrefix(`todos:${user._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update todo.');
    }
  };

  const startEdit = (todo) => { setEditingId(todo._id); setEditText(todo.title); };

  const handleSaveEdit = async (id) => {
    if (!editText.trim()) return;
    try {
      const { data: env } = await todosAPI.update(id, { title: editText.trim() });
      if (env.status === 'UPDATED') {
        setTodos((prev) => prev.map((t) => (t._id === env.data._id ? env.data : t)));
        invalidatePrefix(`todos:${user._id}`);
        setEditingId(null);
        setEditText('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update todo.');
    }
  };

  const cancelEdit = () => { setEditingId(null); setEditText(''); };

  const handleDelete = async (id) => {
    try {
      const { data: env } = await todosAPI.delete(id);
      if (env.status === 'DELETED') {
        const next = todos.filter((t) => t._id !== id);
        setTodos(next);
        if (next.length === 0) setViewStatus('NO_DATA');
        invalidatePrefix(`todos:${user._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete todo.');
    }
  };

  const handleEditKeyDown = (e, id) => {
    if (e.key === 'Enter') handleSaveEdit(id);
    if (e.key === 'Escape') cancelEdit();
  };

  const totalCount     = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const activeCount    = totalCount - completedCount;

  if (viewStatus === 'LOADING') return <Loader message="Loading todos..." />;

  return (
    <div className="page-content">
      <div className="container">
        <div className="todos-header">
          <h1 className="todos-title">
            My Todos <span className="todos-count">({totalCount})</span>
          </h1>
          <div className="todos-filters">
            {['all', 'active', 'completed'].map((f) => (
              <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="todos-stats">
          <div className="stat-card accent"><div className="stat-value">{totalCount}</div><div className="stat-label">Total</div></div>
          <div className="stat-card success"><div className="stat-value">{completedCount}</div><div className="stat-label">Completed</div></div>
          <div className="stat-card warning"><div className="stat-value">{activeCount}</div><div className="stat-label">Active</div></div>
        </div>

        {error && (
          <div className="alert alert-error">
            ⚠ {error}
            <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <form className="todo-search-form" onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
          <input type="text" className="form-input" placeholder="Search by title or todo ID..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
          <button type="submit" className="btn btn-secondary">Search</button>
          {search && <button type="button" className="btn btn-secondary" onClick={() => { setSearch(''); setSearchInput(''); }}>Clear</button>}
        </form>

        <form className="todo-add-form" onSubmit={handleAdd} id="add-todo-form">
          <input type="text" className="todo-add-input" placeholder="What needs to be done?" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} disabled={adding} id="new-todo-input" />
          <button type="submit" className="btn btn-primary todo-add-btn" disabled={adding || !newTitle.trim()} id="add-todo-btn">
            {adding ? 'Adding...' : '+ Add Todo'}
          </button>
        </form>

        <div className="todo-list">
          {viewStatus === 'NO_DATA' && (
            <div className="todo-empty fade-in">
              <div className="todo-empty-icon">✓</div>
              <p>{filter === 'all' ? 'No todos yet. Add one above!' : `No ${filter} todos.`}</p>
            </div>
          )}

          {viewStatus === 'SERVER_ERROR' && (
            <div className="todo-empty">
              <p>Failed to load todos. Please try again.</p>
            </div>
          )}

          {viewStatus === 'SUCCESS' && todos.map((todo) => (
            <div key={todo._id} className={`todo-item ${todo.completed ? 'completed' : ''}`} id={`todo-${todo._id}`}>
              <label className="todo-checkbox">
                <input type="checkbox" checked={todo.completed} onChange={() => handleToggle(todo)} aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`} />
                <span className="checkmark"></span>
              </label>

              {editingId === todo._id ? (
                <input type="text" className="todo-edit-input" value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => handleEditKeyDown(e, todo._id)} autoFocus />
              ) : (
                <div className="todo-content">
                  <span className="todo-title">{todo.title}</span>
                  <div className="todo-date">{new Date(todo.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
              )}

              <div className="todo-actions">
                {editingId === todo._id ? (
                  <>
                    <button className="todo-action-btn save" onClick={() => handleSaveEdit(todo._id)} title="Save">✓</button>
                    <button className="todo-action-btn cancel" onClick={cancelEdit} title="Cancel">✕</button>
                  </>
                ) : (
                  <>
                    <button className="todo-action-btn edit" onClick={() => startEdit(todo)} title="Edit">✎</button>
                    <button className="todo-action-btn delete" onClick={() => handleDelete(todo._id)} title="Delete">🗑</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Todos;
