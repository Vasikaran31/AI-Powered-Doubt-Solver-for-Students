// ============================================
// middleware/upload.js - Multer File Upload Config
// ============================================
// Configures multer to handle image file uploads.
// When a student uploads a photo of their question
// (e.g., a textbook page or whiteboard), this middleware
// processes the file BEFORE the controller runs.
//
// How it works:
//   1. Request hits a route with upload.single("image")
//   2. Multer reads the file from the multipart form data
//   3. Stores it in memory as a Buffer (req.file.buffer)
//   4. Controller then converts the buffer to base64 for the AI
//
// File storage: Memory (no disk writes — faster and simpler)
// Allowed types: jpeg, jpg, png, webp, gif
// Max file size: 10MB
// ============================================

const multer = require("multer");
const path = require("path");

// Use memory storage — files are stored as Buffer, not written to disk
// Access them in the controller via req.file.buffer
const storage = multer.memoryStorage();

// File type filter — only allow image formats
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;

  // Check file extension
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  // Check MIME type (what the browser reports)
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("Only image files (jpeg, jpg, png, webp, gif) are allowed!"));
  }
};

// Create the multer middleware instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

module.exports = upload;
