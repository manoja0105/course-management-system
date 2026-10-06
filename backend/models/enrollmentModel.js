const db = require("../config/db");


const Enrollment = {

  // ============================================================
  // Create enrollment
  // ============================================================

  async create(studentId, courseId) {
    const [result] = await db.execute(
      `INSERT INTO enrollments
       (student_id, course_id)
       VALUES (?, ?)`,
      [studentId, courseId]
    );

    return result.insertId;
  },


  // ============================================================
  // Check if student is already enrolled
  // ============================================================

  async findByStudentAndCourse(studentId, courseId) {
    const [rows] = await db.execute(
      `SELECT *
       FROM enrollments
       WHERE student_id = ?
       AND course_id = ?`,
      [studentId, courseId]
    );

    return rows[0];
  },


  // ============================================================
  // Get all courses enrolled by a student
  // ============================================================

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
       JOIN courses c
         ON e.course_id = c.id
       WHERE e.student_id = ?
       ORDER BY e.enrolled_at DESC`,
      [studentId]
    );

    return rows;
  },


  // ============================================================
  // Get all students enrolled in a course
  // ============================================================

  async getByCourse(courseId) {
    const [rows] = await db.execute(
      `SELECT
          e.id,
          e.enrolled_at,
          u.id AS student_id,
          u.username,
          u.full_name
       FROM enrollments e
       JOIN users u
         ON e.student_id = u.id
       WHERE e.course_id = ?
       ORDER BY e.enrolled_at DESC`,
      [courseId]
    );

    return rows;
  },


  // ============================================================
  // Get all enrollments
  // ============================================================

  async getAll() {
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

       JOIN users u
         ON e.student_id = u.id

       JOIN courses c
         ON e.course_id = c.id

       ORDER BY e.enrolled_at DESC`
    );

    return rows;
  },


  // ============================================================
  // ADMIN: Delete enrollment
  // ============================================================
//
// Existing admin delete functionality.
//
// Only enrollment ID is checked here because the route is
// protected by the admin role middleware.
//

  async delete(id) {
    const [result] = await db.execute(
      `DELETE FROM enrollments
       WHERE id = ?`,
      [id]
    );

    return result;
  },


  // ============================================================
  // STUDENT: Delete own enrollment
  // ============================================================
//
// CR-006 SECURITY REQUIREMENT:
//
// The DELETE query checks BOTH:
//
// 1. enrollment ID
// 2. logged-in student's ID
//
// Therefore, a student cannot delete another student's
// enrollment even if they know the enrollment ID.
//

  async deleteByStudent(enrollmentId, studentId) {
    const [result] = await db.execute(
      `DELETE FROM enrollments
       WHERE id = ?
       AND student_id = ?`,
      [enrollmentId, studentId]
    );

    return result;
  },

};


module.exports = Enrollment;