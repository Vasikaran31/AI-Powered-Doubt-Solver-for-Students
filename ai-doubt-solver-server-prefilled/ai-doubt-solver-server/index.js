// ============================================
// index.js - Entry Point
// ============================================
// This is where the server starts. It:
//   1. Loads environment variables from .env
//   2. Connects to MongoDB
//   3. Starts the Express server on the given PORT
// ============================================

// Load environment variables FIRST (before anything else uses them)
const dotenv = require("dotenv");
dotenv.config();

// Patch async errors so try/catch is not needed in every handler
require("express-async-errors");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

// Import database connection helper
const connectDB = require("./config/db");

// Import all API routes
const doubtRoutes = require("./routes/doubtRoutes");
const authRoutes  = require("./routes/authRoutes");
const chatRoutes  = require("./routes/chatRoutes");

// Import global error handler
const errorHandler = require("./middleware/errorHandler");

// ---- Create the Express App ----
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// STEP 1: Connect to MongoDB
// ============================================
// Wait for database to connect before handling requests
connectDB();

// ============================================
// MIDDLEWARE (runs on every incoming request)
// ============================================

// 1. Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // allow image serving
}));

// 2. CORS: Allow the React frontend to talk to this backend
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, postman) or if origin is allowed
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// 3. HTTP request logging (dev only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 4. Body Parser: Parse incoming JSON request bodies
//    10mb limit to handle base64-encoded images in doubt submissions
app.use(express.json({ limit: "10mb" }));

// 5. URL-encoded body parser (for form submissions)
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 6. Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// ROUTES
// ============================================

// Mount API routes
app.use("/api/auth",   authRoutes);
app.use("/api/chats",  chatRoutes);
app.use("/api/doubts", doubtRoutes);

// ============================================
// HEALTH CHECK
// ============================================
// Simple endpoint to verify the server is running
app.get("/api/health", (req, res) => {
  res.json({ status: "AI Doubt Solver server is running", timestamp: new Date() });
});

// ============================================
// GLOBAL ERROR HANDLER (must be AFTER routes)
// ============================================
app.use(errorHandler);

// ---- Start Listening for Requests ----
app.listen(PORT, () => {
  console.log(`\n AI Doubt Solver server running on port ${PORT}`);
  console.log(` URL: http://localhost:${PORT}\n`);
});
