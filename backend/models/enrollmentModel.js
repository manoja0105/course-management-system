
const db = require("../config/db");

const Enrollment = {
  // Create enrollment
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

  // Create enrollment with capacity checking.
  // Uses callbacks because db.promise() is unavailable.
  async createWithCapacity(studentId, courseId) {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT id, max_students
         FROM courses
         WHERE id = ?`,
        [courseId],
        (error, courses) => {
          if (error) return reject(error);

          if (!courses.length) {
            const err = new Error("Course not found");
            err.code = "COURSE_NOT_FOUND";
            return reject(err);
          }

          db.query(
            `SELECT id
             FROM enrollments
             WHERE student_id = ? AND course_id = ?
             LIMIT 1`,
            [studentId, courseId],
            (existingError, existing) => {
              if (existingError) return reject(existingError);

              if (existing.length) {
                const err = new Error("Already enrolled");
                err.code = "ALREADY_ENROLLED";
                return reject(err);
              }

              const maxStudents = courses[0].max_students;

              const insertEnrollment = () => {
                db.query(
                  `INSERT INTO enrollments (student_id, course_id)
                   VALUES (?, ?)`,
                  [studentId, courseId],
                  (insertError, result) => {
                    if (insertError) {
                      if (insertError.code === "ER_DUP_ENTRY") {
                        insertError.code = "ALREADY_ENROLLED";
                      }
                      return reject(insertError);
                    }

                    resolve(result.insertId);
                  }
                );
              };

              if (
                maxStudents === null ||
                maxStudents === undefined
              ) {
                return insertEnrollment();
              }

              db.query(
                `SELECT COUNT(*) AS total
                 FROM enrollments
                 WHERE course_id = ?`,
                [courseId],
                (countError, counts) => {
                  if (countError) return reject(countError);

                  if (
                    Number(counts[0].total) >= Number(maxStudents)
                  ) {
                    const err = new Error("Course is full");
                    err.code = "COURSE_FULL";
                    return reject(err);
                  }

                  insertEnrollment();
                }
              );
            }
          );
        }
      );
    });
  },

  // Find an enrollment for a student and course
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

  // Get enrollments for a student
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

  // Get enrollments for a course
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

  // CR-008: Search, filtering, sorting and pagination
  getAllPaginated({
    q,
    courseId,
    from,
    toExclusive,
    sort = "date",
    order = "desc",
    limit = 20,
    offset = 0,
  }) {
    return new Promise((resolve, reject) => {
      const conditions = [];
      const values = [];

      if (q) {
        const escaped = q.replace(/[!%_]/g, "!$&");
        const searchValue = `%${escaped}%`;

        conditions.push(
          "(u.full_name LIKE ? ESCAPE '!' OR u.username LIKE ? ESCAPE '!')"
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

      db.query(countSQL, values, (countError, countRows) => {
        if (countError) return reject(countError);

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

        db.query(
          dataSQL,
          [...values, Number(limit), Number(offset)],
          (dataError, enrollments) => {
            if (dataError) return reject(dataError);
            resolve({ enrollments, total });
          }
        );
      });
    });
  },

  // Get all enrollments (legacy method)
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

  // Delete enrollment
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

  // Student cancels their own enrollment
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
