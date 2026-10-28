const express = require("express");

const router = express.Router();

const { login } = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

// POST /api/auth/login
router.post("/login", login);


// Temporary protected route for testing
router.get("/test", authMiddleware, (req, res) => {
  res.json({
    message: "Authentication successful",
    user: req.user
  });
});

module.exports = router;