// ============================================
// routes/authRoutes.js
// ============================================
// POST /api/auth/register  → register (public)
// POST /api/auth/login     → login    (public)
// GET  /api/auth/me        → getMe    (protected)
// ============================================

const express = require('express');
const router  = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login',    login);
router.get('/me',        protect, getMe);

module.exports = router;
