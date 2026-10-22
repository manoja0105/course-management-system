const express = require("express");
const router = express.Router();

const {
  getAdminOverview,
  getMyReport,
} = require("../controllers/reportController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Admin only: GET /api/reports/overview
router.get(
  "/overview",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAdminOverview
);

// Student only: GET /api/reports/my
router.get(
  "/my",
  authMiddleware,
  roleMiddleware(["student"]),
  getMyReport
);

module.exports = router;
