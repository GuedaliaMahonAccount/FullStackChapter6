const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

/**
 * Auth Routes
 * 
 * POST /auth/register  — Create a new user account
 * POST /auth/login     — Authenticate and receive a JWT
 */

router.post('/register', register);
router.post('/login', login);

module.exports = router;
