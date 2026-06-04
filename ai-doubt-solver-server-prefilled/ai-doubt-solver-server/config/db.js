// ============================================
// config/db.js - MongoDB Connection
// ============================================
// Connects to MongoDB using Mongoose.
// Called once at startup in index.js.
//
// How it works:
//   - Reads the MONGODB_URI from your .env file
//   - Attempts to connect
//   - Logs success or exits on failure
// ============================================

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Read the connection string from environment variables
    const mongoURI = process.env.MONGODB_URI;

    // Safety check: stop early if the URI is missing
    if (!mongoURI) {
      throw new Error("MONGODB_URI is not defined in your .env file");
    }

    // Connect to MongoDB
    // Mongoose handles all connection options automatically
    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Stop the server if DB connection fails
  }
};

module.exports = connectDB;
