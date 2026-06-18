const Todo = require('../models/Todo');
const User = require('../models/User');
const { success, created, updated, deleted, noData, notFound, forbidden } = require('../utils/response');
const { invalidate } = require('../middleware/cache');
const logActivity = require('../services/activityLogger');

const getTodos = async (req, res, next) => {
  try {
    const filter = { userId: req.user.id, isDeleted: false };
    if (req.query.completed !== undefined) filter.completed = req.query.completed === 'true';
    if (req.query.title) filter.title = { $regex: req.query.title, $options: 'i' };
    if (req.query._id) filter._id = req.query._id;

    const todos = await Todo.find(filter).sort({ createdAt: 1 });
    if (todos.length === 0) return noData(res, 'No todos found.');
    return success(res, todos, `${todos.length} todo(s) found.`);
  } catch (error) {
    next(error);
  }
};

const getTodoById = async (req, res, next) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, isDeleted: false });
    if (!todo) return notFound(res, 'Todo not found.');
    if (todo.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return forbidden(res, 'Access denied. You can only view your own todos.');
    }
    return success(res, todo, 'Todo retrieved.');
  } catch (error) {
    next(error);
  }
};

const createTodo = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) {
      const { validationError } = require('../utils/response');
      return validationError(res, 'Title is required.');
    }

    const todo = await Todo.create({ userId: req.user.id, title });
    // Invalidate cache for this user to ensure they see the new todo in subsequent requests. 
    invalidate(req.user.id);
    await User.findByIdAndUpdate(req.user.id, { $set: { lastActivityAt: new Date() } });
    logActivity(req.user.id, 'CREATE', 'todo', todo._id, todo.title);
    return created(res, todo, 'Todo created.');
  } catch (error) {
    next(error);
  }
};

const updateTodo = async (req, res, next) => {
  try {
    const todo = req.resource;
    const { title, completed } = req.body;
    if (title !== undefined) todo.title = title;
    if (completed !== undefined) todo.completed = completed;
    await todo.save();
    invalidate(req.user.id);
    await User.findByIdAndUpdate(req.user.id, { $set: { lastActivityAt: new Date() } });
    logActivity(req.user.id, 'UPDATE', 'todo', todo._id, todo.title);
    return updated(res, todo, 'Todo updated.');
  } catch (error) {
    next(error);
  }
};

const deleteTodo = async (req, res, next) => {
  try {
    const todo = req.resource;
    const { title: todoTitle, _id: todoId } = todo;
    todo.isDeleted = true;
    await todo.save();
    invalidate(req.user.id);
    await User.findByIdAndUpdate(req.user.id, { $set: { lastActivityAt: new Date() } });
    logActivity(req.user.id, 'DELETE', 'todo', todoId, todoTitle);
    return deleted(res, 'Todo deleted.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getTodos, getTodoById, createTodo, updateTodo, deleteTodo };
