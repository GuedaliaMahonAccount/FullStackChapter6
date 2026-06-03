const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { checkOwnership } = require('../middleware/ownership');
const Todo = require('../models/Todo');
const {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
} = require('../controllers/todoController');

/**
 * Todo Routes
 * 
 * All routes require authentication.
 * PUT and DELETE use ownership middleware to verify the user owns the todo.
 * 
 * GET    /todos        — Get current user's todos (?completed=true|false)
 * GET    /todos/:id    — Get single todo (owner only)
 * POST   /todos        — Create a new todo
 * PUT    /todos/:id    — Update todo title/completed (owner or admin)
 * DELETE /todos/:id    — Soft delete todo (owner or admin)
 */

router.get('/', auth, getTodos);
router.get('/:id', auth, getTodoById);
router.post('/', auth, createTodo);
router.put('/:id', auth, checkOwnership(Todo), updateTodo);
router.delete('/:id', auth, checkOwnership(Todo), deleteTodo);

module.exports = router;
