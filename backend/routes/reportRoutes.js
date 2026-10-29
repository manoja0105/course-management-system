
const express = require("express");
const router = express.Router();

const {
  getAdminOverview,
  getMyReport,
} = require("../controllers/reportController");

const {
  authenticate,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Admin only: GET /api/reports/overview
router.get(
  "/overview",
  authenticate,
  authorizeRoles("ADMIN"),
  getAdminOverview
);

// Student only: GET /api/reports/my
router.get(
  "/my",
  authenticate,
  authorizeRoles("STUDENT"),
  getMyReport
);

module.exports = router;
