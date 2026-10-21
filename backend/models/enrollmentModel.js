// backend/models/enrollmentModel.js

const db = require("../config/db");

const Enrollment = {
  create(studentId, courseId) {
    return new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO enrollments (student_id, course_id)
         VALUES (?, ?)`,
        [studentId, courseId],
        (error, result) => {
          if (error) return reject(error);
          resolve(result.insertId);
        }
      );
    });
  },

  async createWithCapacity(studentId, courseId) {
    const connection = await db.promise().getConnection();

    try {
      await connection.beginTransaction();

      const [courses] = await connection.query(
        `SELECT id, max_students
         FROM courses
         WHERE id = ?
         FOR UPDATE`,
        [courseId]
      );

      if (!courses.length) {
        const error = new Error("Course not found");
        error.code = "COURSE_NOT_FOUND";
        throw error;
      }

      const [existing] = await connection.query(
        `SELECT id FROM enrollments
         WHERE student_id = ? AND course_id = ?
         LIMIT 1`,
        [studentId, courseId]
      );

      if (existing.length) {
        const error = new Error("Already enrolled");
        error.code = "ALREADY_ENROLLED";
        throw error;
      }

      const maxStudents = courses[0].max_students;

      if (maxStudents !== null && maxStudents !== undefined) {
        const [counts] = await connection.query(
          `SELECT COUNT(*) AS total
           FROM enrollments
           WHERE course_id = ?`,
          [courseId]
        );

        if (Number(counts[0].total) >= Number(maxStudents)) {
          const error = new Error("Course is full");
          error.code = "COURSE_FULL";
          throw error;
        }
      }

      const [result] = await connection.query(
        `INSERT INTO enrollments (student_id, course_id)
         VALUES (?, ?)`,
        [studentId, courseId]
      );

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  findByStudentAndCourse(studentId, courseId) {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT *
         FROM enrollments
         WHERE student_id = ? AND course_id = ?
         LIMIT 1`,
        [studentId, courseId],
        (error, rows) => {
          if (error) return reject(error);
          resolve(rows[0] || null);
        }
      );
    });
  },

  getByStudent(studentId) {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT
           e.id,
           e.student_id,
           e.course_id,
           e.enrolled_at,
           c.title,
           c.category,
           c.level
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         WHERE e.student_id = ?
         ORDER BY e.enrolled_at DESC`,
        [studentId],
        (error, rows) => {
          if (error) return reject(error);
          resolve(rows);
        }
      );
    });
  },

  getByCourse(courseId) {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT
           e.id,
           e.student_id,
           e.course_id,
           e.enrolled_at,
           u.username,
           u.full_name
         FROM enrollments e
         JOIN users u ON u.id = e.student_id
         WHERE e.course_id = ?
         ORDER BY e.enrolled_at DESC`,
        [courseId],
        (error, rows) => {
          if (error) return reject(error);
          resolve(rows);
        }
      );
    });
  },

  // CR-008: Server-side search, filters, sorting and pagination.
  async getAllPaginated({
    q,
    courseId,
    from,
    toExclusive,
    sort = "date",
    order = "desc",
    limit = 20,
    offset = 0,
  }) {
    const conditions = [];
    const values = [];

    if (q) {
      // Escape SQL LIKE wildcard characters.
      const escaped = q.replace(/[!%_]/g, "!$&");
      const searchValue = `%${escaped}%`;

      conditions.push(
        `(u.full_name LIKE ? ESCAPE '!' OR
          u.username LIKE ? ESCAPE '!')`
      );

      values.push(searchValue, searchValue);
    }

    if (courseId !== undefined && courseId !== null) {
      conditions.push("e.course_id = ?");
      values.push(courseId);
    }

    if (from) {
      conditions.push("e.enrolled_at >= ?");
      values.push(from);
    }

    if (toExclusive) {
      conditions.push("e.enrolled_at < ?");
      values.push(toExclusive);
    }

    const whereSQL = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // Allowlist SQL column names; never trust client-provided SQL.
    const sortColumns = {
      date: "e.enrolled_at",
      student: "u.full_name",
      course: "c.title",
    };

    const sortColumn = sortColumns[sort] || sortColumns.date;
    const sortOrder = order === "asc" ? "ASC" : "DESC";

    const countSQL = `
      SELECT COUNT(*) AS total
      FROM enrollments e
      JOIN users u ON u.id = e.student_id
      JOIN courses c ON c.id = e.course_id
      ${whereSQL}
    `;

    const [countRows] = await db
      .promise()
      .query(countSQL, values);

    const total = Number(countRows[0].total);

    const dataSQL = `
      SELECT
        e.id,
        e.student_id,
        e.course_id,
        e.enrolled_at,
        u.username,
        u.full_name,
        c.title AS course_title,
        c.category AS course_category,
        c.level AS course_level
      FROM enrollments e
      JOIN users u ON u.id = e.student_id
      JOIN courses c ON c.id = e.course_id
      ${whereSQL}
      ORDER BY ${sortColumn} ${sortOrder}, e.id DESC
      LIMIT ? OFFSET ?
    `;

    const [enrollments] = await db
      .promise()
      .query(dataSQL, [...values, Number(limit), Number(offset)]);

    return { enrollments, total };
  },

  // Legacy method for existing callers.
  getAll() {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT
           e.id,
           e.student_id,
           e.course_id,
           e.enrolled_at,
           u.username,
           u.full_name,
           c.title AS course_title,
           c.category AS course_category,
           c.level AS course_level
         FROM enrollments e
         JOIN users u ON u.id = e.student_id
         JOIN courses c ON c.id = e.course_id
         ORDER BY e.enrolled_at DESC`,
        (error, rows) => {
          if (error) return reject(error);
          resolve(rows);
        }
      );
    });
  },

  delete(id) {
    return new Promise((resolve, reject) => {
      db.query(
        "DELETE FROM enrollments WHERE id = ?",
        [id],
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  },

  deleteByStudent(id, studentId) {
    return new Promise((resolve, reject) => {
      db.query(
        `DELETE FROM enrollments
         WHERE id = ? AND student_id = ?`,
        [id, studentId],
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  },
};

module.exports = Enrollment;