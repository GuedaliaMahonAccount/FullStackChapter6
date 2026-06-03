import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { todosAPI } from '../api/api';
import Loader from '../components/Loader';
import '../styles/Todos.css';

/**
 * Todos Page
 * 
 * Full CRUD todo management for the authenticated user:
 * - List todos sorted by creation date
 * - Toggle completed status via checkbox (PUT)
 * - Add new todo (POST)
 * - Inline edit todo title (PUT)
 * - Delete todo (DELETE → soft delete)
 * - Filter by All / Active / Completed
 */
const Todos = () => {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // ─── Fetch Todos ──────────────────────────────
  const fetchTodos = useCallback(async () => {
    try {
      setError('');
      const params = {};
      if (filter === 'active') params.completed = 'false';
      if (filter === 'completed') params.completed = 'true';

      const { data } = await todosAPI.getAll(params);
      setTodos(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch todos.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // ─── Add Todo ─────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setAdding(true);
    try {
      const { data } = await todosAPI.create({ title: newTitle.trim() });
      setTodos((prev) => [...prev, data]);
      setNewTitle('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create todo.');
    } finally {
      setAdding(false);
    }
  };

  // ─── Toggle Completed ────────────────────────
  const handleToggle = async (todo) => {
    try {
      const { data } = await todosAPI.update(todo._id, {
        completed: !todo.completed,
      });
      setTodos((prev) =>
        prev.map((t) => (t._id === data._id ? data : t))
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update todo.');
    }
  };

  // ─── Start Editing ───────────────────────────
  const startEdit = (todo) => {
    setEditingId(todo._id);
    setEditText(todo.title);
  };

  // ─── Save Edit ───────────────────────────────
  const handleSaveEdit = async (id) => {
    if (!editText.trim()) return;

    try {
      const { data } = await todosAPI.update(id, { title: editText.trim() });
      setTodos((prev) =>
        prev.map((t) => (t._id === data._id ? data : t))
      );
      setEditingId(null);
      setEditText('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update todo.');
    }
  };

  // ─── Cancel Edit ─────────────────────────────
  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  // ─── Delete Todo ─────────────────────────────
  const handleDelete = async (id) => {
    try {
      await todosAPI.delete(id);
      setTodos((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete todo.');
    }
  };

  // ─── Handle key events for edit input ────────
  const handleEditKeyDown = (e, id) => {
    if (e.key === 'Enter') handleSaveEdit(id);
    if (e.key === 'Escape') cancelEdit();
  };

  // ─── Stats ───────────────────────────────────
  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const activeCount = totalCount - completedCount;

  // ─── Render ──────────────────────────────────
  if (loading) return <Loader message="Loading todos..." />;

  return (
    <div className="page-content">
      <div className="container">
        {/* Header */}
        <div className="todos-header">
          <h1 className="todos-title">
            My Todos
            <span className="todos-count">({totalCount})</span>
          </h1>

          <div className="todos-filters">
            {['all', 'active', 'completed'].map((f) => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="todos-stats">
          <div className="stat-card accent">
            <div className="stat-value">{totalCount}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card success">
            <div className="stat-value">{completedCount}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-value">{activeCount}</div>
            <div className="stat-label">Active</div>
          </div>
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

        {/* Add Todo Form */}
        <form className="todo-add-form" onSubmit={handleAdd} id="add-todo-form">
          <input
            type="text"
            className="todo-add-input"
            placeholder="What needs to be done?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            disabled={adding}
            id="new-todo-input"
          />
          <button
            type="submit"
            className="btn btn-primary todo-add-btn"
            disabled={adding || !newTitle.trim()}
            id="add-todo-btn"
          >
            {adding ? 'Adding...' : '+ Add Todo'}
          </button>
        </form>

        {/* Todo List */}
        <div className="todo-list">
          {todos.length === 0 ? (
            <div className="todo-empty fade-in">
              <div className="todo-empty-icon">✓</div>
              <p>
                {filter === 'all'
                  ? 'No todos yet. Add one above!'
                  : `No ${filter} todos.`}
              </p>
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo._id}
                className={`todo-item ${todo.completed ? 'completed' : ''}`}
                id={`todo-${todo._id}`}
              >
                {/* Checkbox */}
                <label className="todo-checkbox">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggle(todo)}
                    aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
                  />
                  <span className="checkmark"></span>
                </label>

                {/* Content — view or edit mode */}
                {editingId === todo._id ? (
                  <input
                    type="text"
                    className="todo-edit-input"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, todo._id)}
                    autoFocus
                  />
                ) : (
                  <div className="todo-content">
                    <span className="todo-title">{todo.title}</span>
                    <div className="todo-date">
                      {new Date(todo.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="todo-actions">
                  {editingId === todo._id ? (
                    <>
                      <button
                        className="todo-action-btn save"
                        onClick={() => handleSaveEdit(todo._id)}
                        title="Save"
                      >
                        ✓
                      </button>
                      <button
                        className="todo-action-btn cancel"
                        onClick={cancelEdit}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="todo-action-btn edit"
                        onClick={() => startEdit(todo)}
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        className="todo-action-btn delete"
                        onClick={() => handleDelete(todo._id)}
                        title="Delete"
                      >
                        🗑
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Todos;
