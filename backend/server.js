
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
const authRoutes = require("./routes/authRoutes");
const { authenticate } = require("./middleware/authMiddleware");
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");

// Public authentication routes
app.use("/api/auth", authRoutes);

// Course routes (authentication is handled inside courseRoutes)
app.use("/api/courses", courseRoutes);

// Protected routes
app.use("/api/users", authenticate, userRoutes);

// Enrollment routes already define authentication per route
app.use("/api/enrollments", enrollmentRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
