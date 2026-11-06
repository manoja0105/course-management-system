
const db = require("../config/db");

// CR-011: allowed enrollment statuses
const STATUSES = ["pending", "approved", "rejected"];

// Columns shared by the admin list and the "details" lookup
const ADMIN_COLUMNS = `
         e.id,
         e.enrolled_at,
         e.status,
         e.reviewed_by,
         e.reviewed_at,
         e.decision_note,
         r.full_name AS reviewed_by_name,
         u.id AS student_id,
         u.username,
         u.full_name,
         c.id AS course_id,
         c.title,
         c.category,
         c.level`;

const Enrollment = {
  STATUSES,

  // CR-011: a new request ALWAYS starts as "pending"
  async createRequest(studentId, courseId) {
    const [result] = await db.execute(
      `INSERT INTO enrollments (student_id, course_id, status)
       VALUES (?, ?, 'pending')`,
      [studentId, courseId]
    );

    return result.insertId;
  },

  // CR-011: a REJECTED request can be submitted again.
  // The same row is reset to "pending" (student_id + course_id is UNIQUE).
  // "status = 'rejected'" in the WHERE clause makes it safe against races.
  async resubmit(id, studentId) {
    const [result] = await db.execute(
      `UPDATE enrollments
       SET status = 'pending',
           reviewed_by = NULL,
           reviewed_at = NULL,
           decision_note = NULL,
           enrolled_at = CURRENT_TIMESTAMP
       WHERE id = ?
         AND student_id = ?
         AND status = 'rejected'`,
      [id, studentId]
    );

    return result.affectedRows === 1;
  },

  // Find the request of one student for one course (any status)
  async findByStudentAndCourse(studentId, courseId) {
    const [rows] = await db.execute(
      `SELECT *
       FROM enrollments
       WHERE student_id = ? AND course_id = ?`,
      [studentId, courseId]
    );

    return rows[0];
  },

  // Plain row by id
  async getById(id) {
    const [rows] = await db.execute(
      `SELECT * FROM enrollments WHERE id = ?`,
      [id]
    );

    return rows[0];
  },

  // Row by id with student, course and reviewer details
  async getDetails(id) {
    const [rows] = await db.execute(
      `SELECT ${ADMIN_COLUMNS}
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN users r ON e.reviewed_by = r.id
       WHERE e.id = ?`,
      [id]
    );

    return rows[0];
  },

  // Get ALL requests of a student (pending, approved and rejected)
  async getByStudent(studentId) {
    const [rows] = await db.execute(
      `SELECT
         e.id,
         e.enrolled_at,
         e.status,
         e.reviewed_at,
         e.decision_note,
         c.id AS course_id,
         c.title,
         c.category,
         c.level,
         c.duration,
         c.price,
         c.image,
         c.description
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.student_id = ?
       ORDER BY e.enrolled_at DESC, e.id DESC`,
      [studentId]
    );

    return rows;
  },

  // Get the requests of one course (admin) - status is included
  async getByCourse(courseId) {
    const [rows] = await db.execute(
      `SELECT
         e.id,
         e.enrolled_at,
         e.status,
         e.reviewed_at,
         e.decision_note,
         u.id AS student_id,
         u.username,
         u.full_name
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       WHERE e.course_id = ?
       ORDER BY e.enrolled_at DESC, e.id DESC`,
      [courseId]
    );

    return rows;
  },

  // CR-008: Server-side search, filtering, sorting and pagination
  // CR-011: optional status filter  (GET /api/enrollments?status=pending)
  async getAll(options = {}) {
    const {
      q = "",
      courseId = null,
      status = null,
      from = null,
      to = null,
      sort = "date",
      order = "desc",
      page = 1,
      limit = 20
    } = options;

    const sortColumns = {
      date: "e.enrolled_at",
      student: "u.full_name",
      course: "c.title"
    };

    const sortColumn = sortColumns[sort];

    if (!sortColumn) {
      throw new Error("Invalid sort field");
    }

    const sortOrder = order === "asc" ? "ASC" : "DESC";
    const conditions = [];
    const params = [];

    if (q) {
      // Treat %, _ and ! as literal search characters.
      const escapedSearch = q.replace(/[!%_]/g, "!$&");
      const pattern = `%${escapedSearch}%`;

      conditions.push(
        `(u.full_name LIKE ? ESCAPE '!' OR
          u.username LIKE ? ESCAPE '!')`
      );

      params.push(pattern, pattern);
    }

    if (courseId !== null) {
      conditions.push("e.course_id = ?");
      params.push(courseId);
    }

    if (status !== null) {
      if (!STATUSES.includes(status)) {
        throw new Error("Invalid status");
      }

      conditions.push("e.status = ?");
      params.push(status);
    }

    if (from !== null) {
      conditions.push("e.enrolled_at >= ?");
      params.push(`${from} 00:00:00`);
    }

    if (to !== null) {
      conditions.push(
        "e.enrolled_at < DATE_ADD(?, INTERVAL 1 DAY)"
      );
      params.push(to);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // Count all records matching the same filters.
    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       JOIN courses c ON e.course_id = c.id
       ${whereClause}`,
      params
    );

    const total = Number(countRows[0].total);
    const offset = (page - 1) * limit;

    // Retrieve only the requested page.
    const [rows] = await db.execute(
      `SELECT ${ADMIN_COLUMNS}
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN users r ON e.reviewed_by = r.id
       ${whereClause}
       ORDER BY ${sortColumn} ${sortOrder}, e.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      enrollments: rows,
      total
    };
  },

  /*
   * CR-011: approve or reject a PENDING request.
   *
   * Everything runs in ONE transaction:
   *
   *  1. Lock the enrollment row           (SELECT ... FOR UPDATE)
   *  2. Only a "pending" request may be processed
   *  3. When approving:
   *       - lock the COURSE row           (serialises approvals of the
   *                                        same course => the last seat
   *                                        cannot be given twice)
   *       - re-check the course exists
   *       - re-check capacity  (approved enrollments only)
   *       - re-check duplicate approved enrollment
   *  4. Save status, reviewer (from the JWT), date and note
   *
   * READ COMMITTED is used so the capacity COUNT always sees the
   * seats approved by a transaction that finished while we waited
   * for the course lock.
   *
   * Returns { ok: true, id } or { ok: false, code, ... }
   */
  async review(id, status, note, reviewerId) {
    const connection = await db.getConnection();

    try {
      await connection.query(
        "SET TRANSACTION ISOLATION LEVEL READ COMMITTED"
      );

      await connection.beginTransaction();

      // 1. Lock the request
      const [enrollmentRows] = await connection.execute(
        `SELECT id, student_id, course_id, status
         FROM enrollments
         WHERE id = ?
         FOR UPDATE`,
        [id]
      );

      const enrollment = enrollmentRows[0];

      if (!enrollment) {
        await connection.rollback();
        return { ok: false, code: "NOT_FOUND" };
      }

      // 2. Only pending requests can be processed
      if (enrollment.status !== "pending") {
        await connection.rollback();

        return {
          ok: false,
          code: "NOT_PENDING",
          currentStatus: enrollment.status
        };
      }

      // 3. Approval re-checks
      if (status === "approved") {

        // 3a. Course existence (+ lock the course row)
        const [courseRows] = await connection.execute(
          `SELECT id, max_students
           FROM courses
           WHERE id = ?
           FOR UPDATE`,
          [enrollment.course_id]
        );

        const course = courseRows[0];

        if (!course) {
          await connection.rollback();
          return { ok: false, code: "COURSE_NOT_FOUND" };
        }

        // 3b. Duplicate approved enrollment
        const [duplicateRows] = await connection.execute(
          `SELECT id
           FROM enrollments
           WHERE student_id = ?
             AND course_id = ?
             AND status = 'approved'
             AND id <> ?
           LIMIT 1`,
          [enrollment.student_id, enrollment.course_id, id]
        );

        if (duplicateRows.length > 0) {
          await connection.rollback();
          return { ok: false, code: "DUPLICATE" };
        }

        // 3c. Capacity (NULL = unlimited). Approved rows only.
        if (
          course.max_students !== null &&
          course.max_students !== undefined
        ) {
          const [countRows] = await connection.execute(
            `SELECT COUNT(*) AS approved_count
             FROM enrollments
             WHERE course_id = ?
               AND status = 'approved'`,
            [enrollment.course_id]
          );

          const approvedCount = Number(countRows[0].approved_count);

          if (approvedCount >= Number(course.max_students)) {
            await connection.rollback();

            return {
              ok: false,
              code: "COURSE_FULL",
              maxStudents: Number(course.max_students)
            };
          }
        }
      }

      // 4. Save the decision (the AND status = 'pending' is a 2nd guard)
      const [result] = await connection.execute(
        `UPDATE enrollments
         SET status = ?,
             reviewed_by = ?,
             reviewed_at = CURRENT_TIMESTAMP,
             decision_note = ?
         WHERE id = ?
           AND status = 'pending'`,
        [status, reviewerId, note, id]
      );

      if (result.affectedRows !== 1) {
        await connection.rollback();

        return {
          ok: false,
          code: "NOT_PENDING",
          currentStatus: "unknown"
        };
      }

      await connection.commit();

      return { ok: true, id };
    } catch (error) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError.message);
      }

      throw error;
    } finally {
      connection.release();
    }
  },

  // Admin: delete enrollment (any status)
  async delete(id) {
    const [result] = await db.execute(
      `DELETE FROM enrollments WHERE id = ?`,
      [id]
    );

    return result;
  },

  // CR-011: a student may cancel only their OWN request, and only while
  // it is "pending" (withdraw request) or "approved" (leave the course).
  // "rejected" rows cannot be cancelled - the student requests again.
  async cancelByStudent(id, studentId) {
    const [result] = await db.execute(
      `DELETE FROM enrollments
       WHERE id = ?
         AND student_id = ?
         AND status IN ('pending', 'approved')`,
      [id, studentId]
    );

    return result;
  }
};

module.exports = Enrollment;
