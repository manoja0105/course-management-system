
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

const {
  authenticate,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Public routes
router.get("/stats", getStats);
router.get("/", getAllCourses);
router.get("/:id", getCourseById);

// Admin-only routes
router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  createCourse
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  updateCourse
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  deleteCourse
);

module.exports = router;
 