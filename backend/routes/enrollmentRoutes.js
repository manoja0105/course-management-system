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

router.delete(
  "/my/:id",
   authMiddleware,
  roleMiddleware(["student"]),
  cancelMyEnrollment
)


// Admin (JWT + admin role required)
// Delete an enrollment
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteEnrollment
);




module.exports = router;