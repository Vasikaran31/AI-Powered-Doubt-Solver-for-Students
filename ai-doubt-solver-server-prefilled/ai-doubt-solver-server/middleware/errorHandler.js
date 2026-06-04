// ============================================
// middleware/errorHandler.js - Global Error Handler
// ============================================
// Catches all errors thrown by route handlers
// (including async errors forwarded by express-async-errors).
// Returns a consistent JSON error response.
// ============================================

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  // Mongoose duplicate key (e.g., duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ success: false, message: `${field} already exists` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  // Default
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Something went wrong',
  });
};

module.exports = errorHandler;
