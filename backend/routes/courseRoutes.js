
const express = require("express");

const router = express.Router();

const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getStats,
} = require("../controllers/courseController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");


// ======================================================
// Public routes
// ======================================================

// Statistics
router.get(
  "/stats",
  getStats
);

// Get all courses
router.get(
  "/",
  getAllCourses
);

// Get one course
router.get(
  "/:id",
  getCourseById
);


// ======================================================
// Admin-only routes
// ======================================================

// Create course
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["admin"]),
  createCourse
);

// Update course
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  updateCourse
);

// Delete course
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteCourse
);


module.exports = router;

