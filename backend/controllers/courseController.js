const Course = require("../models/courseModel");
const User = require("../models/userModel");
const validateCourse = require("../helpers/validateCourse");


// ======================================================
// GET ALL COURSES
// ======================================================

const getAllCourses = async (req, res) => {

  try {

    const courses =
      await Course.getAll();


    return res.status(200).json({

      message:
        "Courses retrieved successfully",

      courses,

    });

  } catch (error) {

    console.error(
      "Error getting courses:",
      error.message
    );


    return res.status(500).json({

      message:
        "Internal server error",

    });
  }
};


// ======================================================
// GET ONE COURSE
// ======================================================

const getCourseById = async (req, res) => {

  try {

    const { id } =
      req.params;


    const course =
      await Course.getById(id);


    if (!course) {

      return res.status(404).json({

        message:
          "Course not found",

      });
    }


    return res.status(200).json({

      message:
        "Course retrieved successfully",

      course,

    });

  } catch (error) {

    console.error(
      "Error getting course:",
      error.message
    );


    return res.status(500).json({

      message:
        "Internal server error",

    });
  }
};


// ======================================================
// CREATE COURSE
// ======================================================

const createCourse = async (req, res) => {

  try {

    // --------------------------------------------------
    // VALIDATE
    // --------------------------------------------------

    const validation =
      validateCourse(req.body);


    if (!validation.isValid) {

      return res.status(400).json({

        message:
          "Validation failed",

        errors:
          validation.errors,

      });
    }


    const courseData =
      validation.data;


    // --------------------------------------------------
    // DUPLICATE TITLE
    // --------------------------------------------------

    const existingCourse =
      await Course.findByTitle(
        courseData.title
      );


    if (existingCourse) {

      return res.status(400).json({

        message:
          "Validation failed",

        errors: {

          title:
            "A course with this title already exists",

        },

      });
    }


    // --------------------------------------------------
    // CREATE
    // --------------------------------------------------

    const courseId =
      await Course.create(
        courseData
      );


    return res.status(201).json({

      message:
        "Course created successfully",

      courseId,

    });

  } catch (error) {

    console.error(
      "Error creating course:",
      error.message
    );


    return res.status(500).json({

      message:
        "Internal server error",

    });
  }
};


// ======================================================
// UPDATE COURSE
// ======================================================

const updateCourse = async (req, res) => {

  try {

    const { id } =
      req.params;


    // --------------------------------------------------
    // CHECK COURSE
    // --------------------------------------------------

    const existingCourse =
      await Course.getById(id);


    if (!existingCourse) {

      return res.status(404).json({

        message:
          "Course not found",

      });
    }


    // --------------------------------------------------
    // VALIDATE
    // --------------------------------------------------

    const validation =
      validateCourse(req.body);


    if (!validation.isValid) {

      return res.status(400).json({

        message:
          "Validation failed",

        errors:
          validation.errors,

      });
    }


    const courseData =
      validation.data;


    // --------------------------------------------------
    // DUPLICATE TITLE
    // --------------------------------------------------

    const duplicateCourse =
      await Course.findByTitle(
        courseData.title,
        id
      );


    if (duplicateCourse) {

      return res.status(400).json({

        message:
          "Validation failed",

        errors: {

          title:
            "A course with this title already exists",

        },

      });
    }


    // --------------------------------------------------
    // GET CURRENT APPROVED ENROLLMENT COUNT
    // --------------------------------------------------

    const enrolledCount =
      await Course.getEnrollmentCount(id);


    // --------------------------------------------------
    // CAPACITY REDUCTION PROTECTION
    // --------------------------------------------------

    if (
      courseData.max_students !== null &&
      courseData.max_students <
        enrolledCount
    ) {

      return res.status(400).json({

        message:
          "Validation failed",

        errors: {

          max_students:
            `Maximum Students cannot be less than the current approved enrollment count (${enrolledCount})`,

        },

      });
    }


    // --------------------------------------------------
    // UPDATE
    // --------------------------------------------------

    await Course.update(
      id,
      courseData
    );


    // --------------------------------------------------
    // GET UPDATED COURSE
    // --------------------------------------------------

    const updatedCourse =
      await Course.getById(id);


    return res.status(200).json({

      message:
        "Course updated successfully",

      course:
        updatedCourse,

    });

  } catch (error) {

    console.error(
      "Error updating course:",
      error.message
    );


    return res.status(500).json({

      message:
        "Internal server error",

    });
  }
};


// ======================================================
// DELETE COURSE
// ======================================================

const deleteCourse = async (req, res) => {

  try {

    const { id } =
      req.params;


    const existingCourse =
      await Course.getById(id);


    if (!existingCourse) {

      return res.status(404).json({

        message:
          "Course not found",

      });
    }


    await Course.delete(id);


    return res.status(200).json({

      message:
        "Course deleted successfully",

    });

  } catch (error) {

    console.error(
      "Error deleting course:",
      error.message
    );


    return res.status(500).json({

      message:
        "Internal server error",

    });
  }
};


// ======================================================
// GET STATISTICS
// ======================================================

const getStats = async (req, res) => {

  try {

    const courses =
      await Course.getAll();


    const studentCount =
      await User.countByRole(
        "student"
      );


    return res.status(200).json({

      message:
        "Statistics retrieved successfully",

      courseCount:
        courses.length,

      studentCount,

    });

  } catch (error) {

    console.error(
      "Error getting statistics:",
      error.message
    );


    return res.status(500).json({

      message:
        "Internal server error",

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