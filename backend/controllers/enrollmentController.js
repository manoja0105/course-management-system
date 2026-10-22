
const Enrollment = require("../models/enrollmentModel");
const Course = require("../models/courseModel");

// =====================================================
// Enroll in a course
// =====================================================
const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user?.id;

    if (
      !Number.isSafeInteger(Number(courseId)) ||
      Number(courseId) <= 0
    ) {
      return res.status(400).json({
        message: "Course ID must be a positive integer",
      });
    }

    if (!studentId) {
      return res.status(401).json({
        message: "Please login first",
      });
    }

    const enrollmentId = await Enrollment.createWithCapacity(
      studentId,
      Number(courseId)
    );

    return res.status(201).json({
      message: "Course enrollment successful",
      enrollmentId,
    });
  } catch (error) {
    console.error("Error enrolling in course:", error);

    if (error.code === "COURSE_NOT_FOUND") {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    if (
      error.code === "ALREADY_ENROLLED" ||
      error.code === "ER_DUP_ENTRY"
    ) {
      return res.status(409).json({
        code: "ALREADY_ENROLLED",
        message: "You are already enrolled in this course",
      });
    }

    if (error.code === "COURSE_FULL") {
      return res.status(409).json({
        code: "COURSE_FULL",
        message: "Course is full. No seats are currently available.",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// =====================================================
// Get logged-in student's enrollments
// =====================================================
const getMyEnrollments = async (req, res) => {
  try {
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({
        message: "Please login first",
      });
    }

    const enrollments = await Enrollment.getByStudent(studentId);

    return res.status(200).json({
      message: "Enrollments retrieved successfully",
      enrollments,
    });
  } catch (error) {
    console.error("Error getting student enrollments:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// =====================================================
// Student cancels their own enrollment
// =====================================================
const cancelMyEnrollment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: "Invalid enrollment ID",
      });
    }

    const result = await Enrollment.deleteByStudent(
      Number(id),
      req.user.id
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Enrollment not found",
      });
    }

    return res.status(200).json({
      message: "Enrollment cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling enrollment:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// =====================================================
// Get students enrolled in a course
// =====================================================
const getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!/^[1-9]\d*$/.test(courseId)) {
      return res.status(400).json({
        message: "Invalid course ID",
      });
    }

    const course = await Course.getById(Number(courseId));

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    const enrollments = await Enrollment.getByCourse(
      Number(courseId)
    );

    return res.status(200).json({
      message: "Course enrollments retrieved successfully",
      course,
      enrollments,
    });
  } catch (error) {
    console.error("Error getting course enrollments:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// =====================================================
// CR-008 validation helpers
// =====================================================
const isPositiveIntegerString = (value) =>
  typeof value === "string" &&
  /^[1-9]\d*$/.test(value) &&
  Number.isSafeInteger(Number(value));

const isValidDate = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

// =====================================================
// CR-008: Admin search, filters, sorting and pagination
// =====================================================
const getAllEnrollments = async (req, res) => {
  if (
    !req.user ||
    String(req.user.role || "").toUpperCase() !== "ADMIN"
  ) {
    return res.status(403).json({
      message: "Administrator access is required",
    });
  }

  try {
    const allowedParameters = [
      "q",
      "courseId",
      "from",
      "to",
      "sort",
      "order",
      "page",
      "limit",
    ];

    for (const key of Object.keys(req.query)) {
      if (!allowedParameters.includes(key)) {
        return res.status(400).json({
          message: `Unsupported query parameter: ${key}`,
        });
      }
    }

    for (const key of allowedParameters) {
      if (
        req.query[key] !== undefined &&
        typeof req.query[key] !== "string"
      ) {
        return res.status(400).json({
          message: `Invalid query parameter: ${key}`,
        });
      }
    }

    const {
      q,
      courseId: courseIdValue,
      from,
      to,
      sort = "date",
      order = "desc",
      page: pageValue = "1",
      limit: limitValue = "20",
    } = req.query;

    if (!isPositiveIntegerString(pageValue)) {
      return res.status(400).json({
        message: "page must be a positive integer",
      });
    }

    if (
      !isPositiveIntegerString(limitValue) ||
      Number(limitValue) > 100
    ) {
      return res.status(400).json({
        message: "limit must be between 1 and 100",
      });
    }

    let courseId;

    if (courseIdValue !== undefined) {
      if (!isPositiveIntegerString(courseIdValue)) {
        return res.status(400).json({
          message: "courseId must be a positive integer",
        });
      }

      courseId = Number(courseIdValue);
    }

    if (from !== undefined && !isValidDate(from)) {
      return res.status(400).json({
        message: "from must use YYYY-MM-DD format",
      });
    }

    if (to !== undefined && !isValidDate(to)) {
      return res.status(400).json({
        message: "to must use YYYY-MM-DD format",
      });
    }

    if (from && to && from > to) {
      return res.status(400).json({
        message: "from must be earlier than or equal to to",
      });
    }

    if (!["date", "student", "course"].includes(sort)) {
      return res.status(400).json({
        message: "sort must be date, student, or course",
      });
    }

    if (!["asc", "desc"].includes(order)) {
      return res.status(400).json({
        message: "order must be asc or desc",
      });
    }

    const page = Number(pageValue);
    const limit = Number(limitValue);
    const offset = (page - 1) * limit;

    if (!Number.isSafeInteger(offset)) {
      return res.status(400).json({
        message: "page is too large",
      });
    }

    let toExclusive;

    if (to) {
      const nextDay = new Date(`${to}T00:00:00.000Z`);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);

      toExclusive = nextDay
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
    }

    const result = await Enrollment.getAllPaginated({
      q: q?.trim() || undefined,
      courseId,
      from: from ? `${from} 00:00:00` : undefined,
      toExclusive,
      sort,
      order,
      limit,
      offset,
    });

    const total = Number(result.total);
    const totalPages =
      total === 0 ? 0 : Math.ceil(total / limit);

    return res.status(200).json({
      message: "Enrollments retrieved successfully",
      enrollments: result.enrollments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    // Check the backend terminal for the real database error.
    console.error("Error getting admin enrollments:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// =====================================================
// Admin deletes an enrollment
// =====================================================
const deleteEnrollment = async (req, res) => {
  if (
    !req.user ||
    String(req.user.role || "").toUpperCase() !== "ADMIN"
  ) {
    return res.status(403).json({
      message: "Administrator access is required",
    });
  }

  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: "Invalid enrollment ID",
      });
    }

    const result = await Enrollment.delete(Number(id));

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Enrollment not found",
      });
    }

    return res.status(200).json({
      message: "Enrollment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting enrollment:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  enrollInCourse,
  getMyEnrollments,
  getCourseEnrollments,
  getAllEnrollments,
  deleteEnrollment,
  cancelMyEnrollment,
};
