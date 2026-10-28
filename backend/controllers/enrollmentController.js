
const Enrollment = require("../models/enrollmentModel");
const Course = require("../models/courseModel");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const getQueryString = (req, name) => {
  const value = req.query[name];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`Invalid query parameter: ${name}`);
  }

  return value;
};

const parsePositiveInteger = (
  value,
  name,
  defaultValue,
  maximum = Number.MAX_SAFE_INTEGER
) => {
  if (value === undefined) {
    return defaultValue;
  }

  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error(`${name} must be a positive integer`);
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
    throw new Error(
      `${name} must be between 1 and ${maximum}`
    );
  }

  return parsed;
};

const parseDate = (value, name) => {
  if (value === undefined) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${name} must use YYYY-MM-DD format`);
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`${name} is not a valid date`);
  }

  return value;
};

const getValidatedOptions = (req) => {
  const allowed = new Set([
    "q",
    "courseId",
    "from",
    "to",
    "sort",
    "order",
    "page",
    "limit"
  ]);

  for (const key of Object.keys(req.query)) {
    if (!allowed.has(key)) {
      throw new Error(`Unsupported query parameter: ${key}`);
    }
  }

  const q = getQueryString(req, "q") ?? "";

  if (q.length > 100) {
    throw new Error("q must not exceed 100 characters");
  }

  const rawCourseId = getQueryString(req, "courseId");

  const courseId =
    rawCourseId === undefined
      ? null
      : parsePositiveInteger(
          rawCourseId,
          "courseId",
          null
        );

  const from = parseDate(getQueryString(req, "from"), "from");
  const to = parseDate(getQueryString(req, "to"), "to");

  if (from && to && from > to) {
    throw new Error("from must not be later than to");
  }

  const sort = getQueryString(req, "sort") ?? "date";
  const order = getQueryString(req, "order") ?? "desc";

  if (!["date", "student", "course"].includes(sort)) {
    throw new Error("sort must be date, student, or course");
  }

  if (!["asc", "desc"].includes(order)) {
    throw new Error("order must be asc or desc");
  }

  const page = parsePositiveInteger(
    getQueryString(req, "page"),
    "page",
    1
  );

  const limit = parsePositiveInteger(
    getQueryString(req, "limit"),
    "limit",
    DEFAULT_LIMIT,
    MAX_LIMIT
  );

  return { q, courseId, from, to, sort, order, page, limit };
};

// Student: enroll in a course
const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user.id;

    if (
      courseId === undefined ||
      courseId === null ||
      !/^[1-9]\d*$/.test(String(courseId))
    ) {
      return res.status(400).json({
        message: "A valid course ID is required"
      });
    }

    const validCourseId = Number(courseId);
    const course = await Course.getById(validCourseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found"
      });
    }

    const existing = await Enrollment.findByStudentAndCourse(
      studentId,
      validCourseId
    );

    if (existing) {
      return res.status(409).json({
        message: "You are already enrolled in this course"
      });
    }

    const enrollmentId = await Enrollment.create(
      studentId,
      validCourseId
    );

    return res.status(201).json({
      message: "Course enrollment successful",
      enrollmentId
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "You are already enrolled in this course"
      });
    }

    console.error("Error enrolling in course:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Student: get own enrolled courses
const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.getByStudent(req.user.id);

    return res.status(200).json({
      message: "Enrollments retrieved successfully",
      enrollments
    });
  } catch (error) {
    console.error("Error getting student enrollments:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Admin: get students enrolled in a specific course
const getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!/^[1-9]\d*$/.test(courseId)) {
      return res.status(400).json({
        message: "Invalid course ID"
      });
    }

    const course = await Course.getById(Number(courseId));

    if (!course) {
      return res.status(404).json({
        message: "Course not found"
      });
    }

    const enrollments = await Enrollment.getByCourse(
      Number(courseId)
    );

    return res.status(200).json({
      message: "Course enrollments retrieved successfully",
      course,
      enrollments
    });
  } catch (error) {
    console.error("Error getting course enrollments:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Admin: CR-008 server-side listing
const getAllEnrollments = async (req, res) => {
  let options;

  try {
    options = getValidatedOptions(req);
  } catch (error) {
    return res.status(400).json({
      message: error.message
    });
  }

  try {
    const { enrollments, total } = await Enrollment.getAll(options);

    return res.status(200).json({
      message: "Enrollments retrieved successfully",
      enrollments,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error("Error getting all enrollments:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Admin: delete enrollment
const deleteEnrollment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: "Invalid enrollment ID"
      });
    }

    const result = await Enrollment.delete(Number(id));

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Enrollment not found"
      });
    }

    return res.status(200).json({
      message: "Enrollment deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting enrollment:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports = {
  enrollInCourse,
  getMyEnrollments,
  getCourseEnrollments,
  getAllEnrollments,
  deleteEnrollment
};
