
const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");

// Login route
router.post("/login", authController.login);

// Protected test route
router.get("/test", authenticate, (req, res) => {
  res.json({
    message: "Authentication successful",
    user: req.user,
  });
});

module.exports = router;
