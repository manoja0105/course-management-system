const express = require("express");

const router = express.Router();

const {
  enrollInCourse,
  getMyEnrollments,
  getCourseEnrollments,
  getAllEnrollments,
  deleteEnrollment,
  cancelMyEnrollment,
} = require("../controllers/enrollmentController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");


// ============================================================
// STUDENT ROUTES
// ============================================================

// Student (JWT + student role required)
// Enroll in a course
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["student"]),
  enrollInCourse
);


// Student (JWT + student role required)
// View my enrolled courses
router.get(
  "/my",
  authMiddleware,
  roleMiddleware(["student"]),
  getMyEnrollments
);


// Student (JWT + student role required)
// Cancel my own enrollment
//
// IMPORTANT:
// The student ID is NOT taken from the URL or request body.
// The backend identifies the logged-in student using req.user.id.
router.delete(
  "/my/:id",
  authMiddleware,
  roleMiddleware(["student"]),
  cancelMyEnrollment
);


// ============================================================
// ADMIN ROUTES
// ============================================================

// Admin (JWT + admin role required)
// View all enrollments
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllEnrollments
);


// Admin (JWT + admin role required)
// View students enrolled in a course
router.get(
  "/course/:courseId",
  authMiddleware,
  roleMiddleware(["admin"]),
  getCourseEnrollments
);


// Admin (JWT + admin role required)
// Delete an enrollment
//
// Existing admin functionality is preserved.
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteEnrollment
);


module.exports = router;