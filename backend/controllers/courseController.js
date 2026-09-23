
const Course = require("../models/courseModel");
const User = require("../models/userModel");
const validateCourse = require("../helpers/validateCourse");


// ======================================================
// Get all courses
// ======================================================

const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.getAll();

    res.status(200).json({
      message: "Courses retrieved successfully",
      courses,
    });

  } catch (error) {
    console.error(
      "Error getting courses:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// ======================================================
// Get one course
// ======================================================

const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.getById(id);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    res.status(200).json({
      message: "Course retrieved successfully",
      course,
    });

  } catch (error) {
    console.error(
      "Error getting course:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// ======================================================
// Create course
// ======================================================

const createCourse = async (req, res) => {
  try {
    /*
      Authentication and authorization are already performed
      by the route middleware BEFORE this controller runs.

      Order:
      Authentication
          ↓
      Authorization
          ↓
      Validation
          ↓
      Duplicate check
          ↓
      Database operation
    */

    // ---------- Validate and trim ----------
    const validation = validateCourse(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const courseData = validation.data;

    // ---------- Duplicate title check ----------
    const existingCourse = await Course.findByTitle(
      courseData.title
    );

    if (existingCourse) {
      return res.status(400).json({
        message: "Validation failed",
        errors: {
          title: "A course with this title already exists",
        },
      });
    }

    // ---------- Create ----------
    const courseId = await Course.create(courseData);

    res.status(201).json({
      message: "Course created successfully",
      courseId,
    });

  } catch (error) {
    console.error(
      "Error creating course:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// ======================================================
// Update course
// ======================================================

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // ---------- Check if course exists ----------
    const existingCourse = await Course.getById(id);

    if (!existingCourse) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    // ---------- Validate and trim ----------
    const validation = validateCourse(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const courseData = validation.data;

    // ---------- Duplicate title check ----------
    // Exclude the course currently being updated.
    const duplicateCourse = await Course.findByTitle(
      courseData.title,
      id
    );

    if (duplicateCourse) {
      return res.status(400).json({
        message: "Validation failed",
        errors: {
          title: "A course with this title already exists",
        },
      });
    }

    // ---------- Update ----------
    await Course.update(id, courseData);

    // ---------- Get updated course ----------
    const updatedCourse = await Course.getById(id);

    res.status(200).json({
      message: "Course updated successfully",
      course: updatedCourse,
    });

  } catch (error) {
    console.error(
      "Error updating course:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// ======================================================
// Delete course
// ======================================================

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const existingCourse = await Course.getById(id);

    if (!existingCourse) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    await Course.delete(id);

    res.status(200).json({
      message: "Course deleted successfully",
    });

  } catch (error) {
    console.error(
      "Error deleting course:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// ======================================================
// Get statistics - PUBLIC
// ======================================================

const getStats = async (req, res) => {
  try {
    const courses = await Course.getAll();
    const studentCount = await User.countByRole("student");

    res.status(200).json({
      message: "Statistics retrieved successfully",
      courseCount: courses.length,
      studentCount,
    });

  } catch (error) {
    console.error(
      "Error getting statistics:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getStats,
};
