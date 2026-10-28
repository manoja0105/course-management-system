
const db = require("../config/db");

const Enrollment = {
  // Create enrollment
  async create(studentId, courseId) {
    const [result] = await db.execute(
      `INSERT INTO enrollments (student_id, course_id)
       VALUES (?, ?)`,
      [studentId, courseId]
    );

    return result.insertId;
  },

  // Check duplicate enrollment
  async findByStudentAndCourse(studentId, courseId) {
    const [rows] = await db.execute(
      `SELECT *
       FROM enrollments
       WHERE student_id = ? AND course_id = ?`,
      [studentId, courseId]
    );

    return rows[0];
  },

  // Get a student's enrolled courses
  async getByStudent(studentId) {
    const [rows] = await db.execute(
      `SELECT
         e.id,
         e.enrolled_at,
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

  // Get students enrolled in a course
  async getByCourse(courseId) {
    const [rows] = await db.execute(
      `SELECT
         e.id,
         e.enrolled_at,
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
  async getAll(options = {}) {
    const {
      q = "",
      courseId = null,
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
      `SELECT
         e.id,
         e.enrolled_at,
         u.id AS student_id,
         u.username,
         u.full_name,
         c.id AS course_id,
         c.title,
         c.category,
         c.level
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       JOIN courses c ON e.course_id = c.id
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

  // Delete enrollment
  async delete(id) {
    const [result] = await db.execute(
      `DELETE FROM enrollments WHERE id = ?`,
      [id]
    );

    return result;
  }
};

module.exports = Enrollment;
