const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 3000;


app.use(cors());


// Parse JSON request bodies
app.use(express.json());

const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const reportRoutes = require("./routes/reportRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);

app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/enrollments", authMiddleware, enrollmentRoutes);

// Authentication and role checks are in reportRoutes.js
app.use("/api/reports", reportRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
