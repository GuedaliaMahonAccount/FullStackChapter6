const Todo = require('../models/Todo');

/**
 * GET /todos
 * Get all todos for the authenticated user.
 * Supports query filtering: ?completed=true|false
 */
const getTodos = async (req, res, next) => {
  try {
    const filter = {
      userId: req.user.id,
      isDeleted: false,
    };

    // Optional completed filter
    if (req.query.completed !== undefined) {
      filter.completed = req.query.completed === 'true';
    }

    const todos = await Todo.find(filter).sort({ createdAt: 1 });
    res.json(todos);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /todos/:id
 * Get a single todo by ID. Owner only.
 */
const getTodoById = async (req, res, next) => {
  try {
    const todo = await Todo.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found.' });
    }

    // Check ownership (unless admin)
    if (todo.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied. You can only view your own todos.',
      });
    }

    res.json(todo);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /todos
 * Create a new todo for the authenticated user.
 * 
 * Body: { title }
 */
const createTodo = async (req, res, next) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    const todo = await Todo.create({
      userId: req.user.id,
      title,
    });

    res.status(201).json(todo);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /todos/:id
 * Update a todo (title and/or completed status).
 * Owner only (or admin).
 * 
 * Body: { title?, completed? }
 */
const updateTodo = async (req, res, next) => {
  try {
    // req.resource is set by checkOwnership middleware
    const todo = req.resource;
    const { title, completed } = req.body;

    if (title !== undefined) todo.title = title;
    if (completed !== undefined) todo.completed = completed;

    await todo.save();
    res.json(todo);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /todos/:id
 * Soft-delete a todo (set isDeleted to true).
 * Owner only (or admin).
 */
const deleteTodo = async (req, res, next) => {
  try {
    // req.resource is set by checkOwnership middleware
    const todo = req.resource;

    todo.isDeleted = true;
    await todo.save();

    res.json({ message: 'Todo deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
};
