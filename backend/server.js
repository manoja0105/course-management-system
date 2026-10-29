
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const reportRoutes = require("./routes/reportRoutes");

const {
  authenticate,
} = require("./middleware/authMiddleware");

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);

app.use("/api/users", authenticate, userRoutes);
app.use("/api/enrollments", authenticate, enrollmentRoutes);

// Authentication and role checks are handled in reportRoutes.js
app.use("/api/reports", reportRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
