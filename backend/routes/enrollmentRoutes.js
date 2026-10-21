// backend/routes/enrollmentRoutes.js

const express = require("express");

const {
  enrollInCourse,
  getMyEnrollments,
  getCourseEnrollments,
  getAllEnrollments,
  deleteEnrollment,
  cancelMyEnrollment,
} = require("../controllers/enrollmentController");

const {
  authenticate,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Student routes
router.post(
  "/",
  authenticate,
  authorizeRoles("STUDENT"),
  enrollInCourse
);

router.get(
  "/my",
  authenticate,
  authorizeRoles("STUDENT"),
  getMyEnrollments
);

router.delete(
  "/my/:id",
  authenticate,
  authorizeRoles("STUDENT"),
  cancelMyEnrollment
);

// Admin routes
router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  getAllEnrollments
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  deleteEnrollment
);

router.get(
  "/course/:courseId",
  authenticate,
  getCourseEnrollments
);

module.exports = router;