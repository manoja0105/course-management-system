
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Handle invalid or empty JSON requests
app.use((err, req, res, next) => {
    if (
        err instanceof SyntaxError &&
        err.status === 400 &&
        "body" in err
    ) {
        console.error(
            "Invalid JSON request:",
            req.method,
            req.originalUrl
        );

        return res.status(400).json({
            message:
                "Invalid JSON body. Check the Postman Body and Headers settings."
        });
    }

    next(err);
});

// API routes
const authRoutes = require("./routes/authRoutes");
const { authenticate } = require("./middleware/authMiddleware");
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");

// Public authentication routes
app.use("/api/auth", authRoutes);

// Course routes
app.use("/api/courses", courseRoutes);

// Protected user routes
app.use("/api/users", authenticate, userRoutes);

// Enrollment routes
app.use("/api/enrollments", enrollmentRoutes);

// Handle other server errors
app.use((err, req, res, next) => {
    console.error("Server error:", err);

    res.status(500).json({
        message: "Internal server error"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
