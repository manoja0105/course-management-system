
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
    "status",
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

  // CR-011: GET /api/enrollments?status=pending
  const rawStatus = getQueryString(req, "status");

  if (
    rawStatus !== undefined &&
    rawStatus !== "" &&
    !Enrollment.STATUSES.includes(rawStatus)
  ) {
    throw new Error("status must be pending, approved, or rejected");
  }

  const status =
    rawStatus === undefined || rawStatus === ""
      ? null
      : rawStatus;

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

  return { q, courseId, status, from, to, sort, order, page, limit };
};

// Student: REQUEST enrollment in a course (CR-011)
//
// The request is saved as "pending". It does not use a seat until an
// administrator approves it.
//
// Duplicate rules:
//   pending   -> 409 (request already waiting)
//   approved  -> 409 (already enrolled)
//   rejected  -> allowed: the SAME row is reset to "pending"
const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body || {};
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

    if (existing && existing.status === "pending") {
      return res.status(409).json({
        message:
          "You already have a pending enrollment request for this course",
        currentStatus: "pending"
      });
    }

    if (existing && existing.status === "approved") {
      return res.status(409).json({
        message: "You are already enrolled in this course",
        currentStatus: "approved"
      });
    }

    // Rejected before -> submit the same request again
    if (existing && existing.status === "rejected") {
      const resubmitted = await Enrollment.resubmit(
        existing.id,
        studentId
      );

      if (!resubmitted) {
        return res.status(409).json({
          message:
            "This request has changed. Please refresh the page."
        });
      }

      return res.status(201).json({
        message:
          "Enrollment request submitted again. It is now pending approval.",
        enrollmentId: existing.id,
        status: "pending"
      });
    }

    const enrollmentId = await Enrollment.createRequest(
      studentId,
      validCourseId
    );

    return res.status(201).json({
      message:
        "Enrollment request submitted. It is now pending approval.",
      enrollmentId,
      status: "pending"
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message:
          "You already have an enrollment request for this course"
      });
    }

    console.error("Error requesting enrollment:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Student: get own enrollment requests (pending, approved, rejected)
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

// Admin: approve or reject a request (CR-011)
//
// PATCH /api/enrollments/:id/status
// { "status": "approved", "reason": "" }
// { "status": "rejected", "reason": "Required prerequisite is missing" }
const MAX_NOTE_LENGTH = 500;

const reviewEnrollment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: "Invalid enrollment ID"
      });
    }

    const { status, reason } = req.body || {};

    if (status !== "approved" && status !== "rejected") {
      return res.status(400).json({
        message: "status must be approved or rejected"
      });
    }

    if (
      reason !== undefined &&
      reason !== null &&
      typeof reason !== "string"
    ) {
      return res.status(400).json({
        message: "reason must be text"
      });
    }

    const note = (reason || "").trim();

    if (status === "rejected" && note === "") {
      return res.status(400).json({
        message: "A rejection reason is required"
      });
    }

    if (note.length > MAX_NOTE_LENGTH) {
      return res.status(400).json({
        message: `reason must not exceed ${MAX_NOTE_LENGTH} characters`
      });
    }

    // The reviewer is ALWAYS the authenticated administrator.
    // Any reviewer id sent in the body is ignored.
    const reviewerId = req.user.id;

    const result = await Enrollment.review(
      Number(id),
      status,
      note === "" ? null : note,
      reviewerId
    );

    if (!result.ok) {
      switch (result.code) {
        case "NOT_FOUND":
          return res.status(404).json({
            message: "Enrollment not found"
          });

        case "NOT_PENDING":
          return res.status(409).json({
            message:
              `This request is already ${result.currentStatus} ` +
              "and cannot be processed again",
            currentStatus: result.currentStatus
          });

        case "COURSE_NOT_FOUND":
          return res.status(404).json({
            message: "Course not found"
          });

        case "COURSE_FULL":
          return res.status(409).json({
            message:
              "Cannot approve: the course is full " +
              `(${result.maxStudents} of ${result.maxStudents} seats taken)`
          });

        case "DUPLICATE":
          return res.status(409).json({
            message:
              "Cannot approve: the student is already enrolled in this course"
          });

        default:
          return res.status(500).json({
            message: "Internal server error"
          });
      }
    }

    const enrollment = await Enrollment.getDetails(result.id);

    return res.status(200).json({
      message:
        status === "approved"
          ? "Enrollment request approved"
          : "Enrollment request rejected",
      enrollment
    });
  } catch (error) {
    console.error("Error reviewing enrollment:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Student: cancel own request / enrollment (CR-006 + CR-011)
//
// Allowed statuses:  pending  -> request withdrawn
//                    approved -> student leaves the course
// Not allowed:       rejected -> (request again instead)
const cancelMyEnrollment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: "Invalid enrollment ID"
      });
    }

    const enrollment = await Enrollment.getById(Number(id));

    // Somebody else's record is reported as "not found"
    if (!enrollment || Number(enrollment.student_id) !== Number(req.user.id)) {
      return res.status(404).json({
        message: "Enrollment not found"
      });
    }

    if (enrollment.status === "rejected") {
      return res.status(409).json({
        message:
          "A rejected request cannot be cancelled. " +
          "You can submit a new request instead."
      });
    }

    const result = await Enrollment.cancelByStudent(
      Number(id),
      req.user.id
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Enrollment not found"
      });
    }

    return res.status(200).json({
      message:
        enrollment.status === "pending"
          ? "Enrollment request cancelled successfully"
          : "Enrollment cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling enrollment:", error);

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
  reviewEnrollment,
  cancelMyEnrollment,
  deleteEnrollment
};
