const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { register, login, getMe } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
// Order reconnect the user's authentication state and get the user data. This me router used to check if the user is still logged in when the page is refreshed.
router.get('/me', auth, getMe);

module.exports = router;
