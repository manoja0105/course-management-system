
const express = require("express");
const router = express.Router();

const {
  enrollInCourse,
  getMyEnrollments,
  getCourseEnrollments,
  getAllEnrollments,
  reviewEnrollment,
  cancelMyEnrollment,
  deleteEnrollment
} = require("../controllers/enrollmentController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Student: request enrollment (saved as "pending")
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["student"]),
  enrollInCourse
);

// Student: view own courses
router.get(
  "/my",
  authMiddleware,
  roleMiddleware(["student"]),
  getMyEnrollments
);

// Student: cancel own pending / approved enrollment
router.delete(
  "/my/:id",
  authMiddleware,
  roleMiddleware(["student"]),
  cancelMyEnrollment
);

// Admin: paginated enrollment list (?status=pending|approved|rejected)
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllEnrollments
);

// Admin: list students in one course
router.get(
  "/course/:courseId",
  authMiddleware,
  roleMiddleware(["admin"]),
  getCourseEnrollments
);

// Admin: approve or reject a pending request (CR-011)
router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware(["admin"]),
  reviewEnrollment
);

// Admin: delete an enrollment (any status)
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteEnrollment
);

module.exports = router;
