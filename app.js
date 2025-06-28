// app.js
import express from "express";
import dotenv from "dotenv";
import sequelize from "./config/database.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import contactRoutes from "./routes/contact.js";
import spamRoutes from "./routes/spam.js";
import searchRoutes from "./routes/search.js";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // For parsing application/json

// Test DB connection and sync models
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
    // Sync all models - This creates tables if they don't exist
    // In production, consider migrations for schema changes
    await sequelize.sync();
    console.log("All models were synchronized successfully.");
  } catch (error) {
    console.error("Unable to connect to the database or sync models:", error);
    // Exit process if database connection fails
    process.exit(1);
  }
}

// Initialize database and then start server
initializeDatabase().then(() => {
  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/contacts", contactRoutes);
  app.use("/api/spam", spamRoutes);
  app.use("/api/search", searchRoutes);

  // Basic health check route
  app.get("/", (req, res) => {
    res.status(200).json({ message: "Spam Detection API is running!" });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
  });

  // Start the server
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
