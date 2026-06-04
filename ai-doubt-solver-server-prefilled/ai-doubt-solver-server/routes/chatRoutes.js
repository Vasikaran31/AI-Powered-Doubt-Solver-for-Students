// ============================================
// routes/chatRoutes.js
// ============================================
// All routes require authentication (protect middleware).
// Stats route must come BEFORE /:id to avoid
// Express matching "stats" as a chat ID.
// ============================================

const express = require('express');
const router  = express.Router();
const upload  = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const {
  getChats, getChatById, createChat, deleteChat, getStats,
  askText, askImage, askVoice,
} = require('../controllers/chatController');

// Apply auth to all chat routes
router.use(protect);

// Stats must come before /:id
router.get('/stats', getStats);

// CRUD
router.get('/',     getChats);
router.post('/',    createChat);
router.get('/:id',  getChatById);
router.delete('/:id', deleteChat);

// AI doubt routes
router.post('/:id/text',  askText);
router.post('/:id/image', upload.single('image'), askImage);

// Voice — allow any audio MIME types
const uploadAudio = require('multer')({
  storage: require('multer').memoryStorage(),
  limits:  { fileSize: 25 * 1024 * 1024 }, // 25MB for audio
});
router.post('/:id/voice', uploadAudio.single('audio'), askVoice);

module.exports = router;
