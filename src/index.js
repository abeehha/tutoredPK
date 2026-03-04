require("dotenv").config();
require("express-async-errors");

const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Root Route
app.get("/", (req, res) => {
  res.json({
    status: "Server is running",
    message: "Use /health to check database connectivity",
  });
});

// Health Route
app.get("/health", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json({
    status: "Server is running",
    db_time: result.rows[0].now,
  });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(500).json({
    message: "Internal Server Error",
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the other process or change PORT in .env.`);
    process.exit(1);
  }
  throw err;
});
