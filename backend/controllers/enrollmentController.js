const Enrollment =
  require("../models/enrollmentModel");

const Course =
  require("../models/courseModel");


// ======================================================
// STUDENT - ENROLL IN COURSE
// ======================================================

const enrollInCourse = async (req, res) => {

  try {

    const { courseId } =
      req.body;


    // --------------------------------------------------
    // STUDENT ID FROM AUTHENTICATION
    // --------------------------------------------------

    const studentId =
      req.user.id;


    // --------------------------------------------------
    // CHECK COURSE ID
    // --------------------------------------------------

    if (!courseId) {

      return res.status(400).json({

        message:
          "Course ID is required",

      });
    }


    // --------------------------------------------------
    // CHECK COURSE EXISTS
    // --------------------------------------------------

    const course =
      await Course.getById(
        courseId
      );


    if (!course) {

      return res.status(404).json({

        message:
          "Course not found",

      });
    }


    // --------------------------------------------------
    // CHECK ALREADY ENROLLED
    //
    // This is done before the transaction only for
    // user-friendly response.
    //
    // The transaction also checks it again.
    // --------------------------------------------------

    const existingEnrollment =
      await Enrollment.findByStudentAndCourse(
        studentId,
        courseId
      );


    if (existingEnrollment) {

      return res.status(409).json({

        message:
          "You are already enrolled in this course",

      });
    }


    // --------------------------------------------------
    // ATOMIC CREATE
    // --------------------------------------------------

    const enrollmentId =
      await Enrollment.create(
        studentId,
        courseId
      );


    return res.status(201).json({

      message:
        "Course enrollment successful",

      enrollmentId,

    });

  } catch (error) {

    // --------------------------------------------------
    // FULL COURSE
    // --------------------------------------------------

    if (
      error.message ===
      "COURSE_FULL"
    ) {

      return res.status(409).json({

        message:
          "This course is full. No seats are currently available.",

      });
    }


    // --------------------------------------------------
    // COURSE NOT FOUND
    // --------------------------------------------------

    if (
      error.message ===
      "COURSE_NOT_FOUND"
    ) {

      return res.status(404).json({

        message:
          "Course not found",

      });
    }


    // --------------------------------------------------
    // ALREADY ENROLLED
    // --------------------------------------------------

    if (
      error.message ===
      "ALREADY_ENROLLED"
    ) {

      return res.status(409).json({

        message:
          "You are already enrolled in this course",

      });
    }


    // --------------------------------------------------
    // MYSQL DUPLICATE PROTECTION
    // --------------------------------------------------

    if (
      error.code ===
      "ER_DUP_ENTRY"
    ) {

      return res.status(409).json({

        message:
          "You are already enrolled in this course",

      });
    }


    console.error(
      "Error enrolling in course:",
      error.message
    );


    return res.status(500).json({

      message:
        "Internal server error",

    });
  }
};


// ======================================================
// STUDENT - GET MY ENROLLMENTS
// ======================================================

const getMyEnrollments = async (req, res) => {

  try {

    const studentId =
      req.user.id;


    const enrollments =
      await Enrollment.getByStudent(
        studentId
      );


    return res.status(200).json({

      message:
        "Enrollments retrieved successfully",

      enrollments,

    });

  } catch (error) {

    console.error(
      "Error getting student enrollments:",
      error.message
    );


    return res.status(500).json({

      message:
        "Internal server error",

    });
  }
};


// ======================================================
// STUDENT - CANCEL OWN ENROLLMENT
// ======================================================

const cancelMyEnrollment = async (req, res) => {

  try {

    const { id } =
      req.params;


    // --------------------------------------------------
    // VALIDATE ID
    // --------------------------------------------------

    if (!/^\d+$/.test(id)) {

      return res.status(400).json({

        message:
          "Invalid enrollment ID",

      });
    }


    const enrollmentId =
      Number(id);


    // --------------------------------------------------
    // AUTHENTICATED STUDENT
    // --------------------------------------------------

    const studentId =
      req.user.id;


    // --------------------------------------------------
    // DELETE OWN ENROLLMENT
    // --------------------------------------------------

    const result =
      await Enrollment.deleteByStudent(
        enrollmentId,
        studentId
      );


    if (
      result.affectedRows === 0
    ) {

      return res.status(404).json({

        message:
          "Enrollment not found",

      });
    }


    // --------------------------------------------------
    // SUCCESS
    //
    // Deleting the enrollment automatically releases
    // the seat because availability is calculated from
    // the current enrollment count.
    // --------------------------------------------------

    return res.status(200).json({

      message:
        "Enrollment cancelled successfully",

    });

  } catch (error) {

    console.error(
      "Error cancelling enrollment:",
      error.message
    );


    return res.status(500).json({

      message:
        "Internal server error",

    });
  }
};


// ======================================================
// ADMIN - GET COURSE ENROLLMENTS
// ======================================================

const getCourseEnrollments = async (req, res) => {

  try {

    const { courseId } =
      req.params;


    const course =
      await Course.getById(
        courseId
      );


    if (!course) {

      return res.status(404).json({

        message:
          "Course not found",

      });
    }


    const enrollments =
      await Enrollment.getByCourse(
        courseId
      );


    return res.status(200).json({

      message:
        "Course enrollments retrieved successfully",

      course,

      enrollments,

    });

  } catch (error) {

    console.error(
      "Error getting course enrollments:",
      error.message
    );


    return res.status(500).json({

      message:
        "Internal server error",

    });
  }
};


// ======================================================
// ADMIN - GET ALL ENROLLMENTS
// ======================================================

const getAllEnrollments = async (req, res) => {

  try {

    const enrollments =
      await Enrollment.getAll();


    return res.status(200).json({

      message:
        "All enrollments retrieved successfully",

      enrollments,

    });

  } catch (error) {

    console.error(
      "Error getting all enrollments:",
      error.message
    );


    return res.status(500).json({

      message:
        "Internal server error",

    });
  }
};


// ======================================================
// ADMIN - DELETE ENROLLMENT
// ======================================================

const deleteEnrollment = async (req, res) => {

  try {

    const { id } =
      req.params;


    const result =
      await Enrollment.delete(id);


    if (
      result.affectedRows === 0
    ) {

      return res.status(404).json({

        message:
          "Enrollment not found",

      });
    }


    return res.status(200).json({

      message:
        "Enrollment deleted successfully",

    });

  } catch (error) {

    console.error(
      "Error deleting enrollment:",
      error.message
    );


    return res.status(500).json({

      message:
        "Internal server error",

    });
  }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {

  enrollInCourse,

  getMyEnrollments,

  cancelMyEnrollment,

  getCourseEnrollments,

  getAllEnrollments,

  deleteEnrollment,

};