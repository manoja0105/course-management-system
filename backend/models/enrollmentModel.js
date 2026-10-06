const db = require("../config/db");


const Enrollment = {

  // ====================================================
  // CREATE ENROLLMENT
  // ATOMIC CAPACITY CHECK
  // ====================================================

  async create(studentId, courseId) {

    const connection =
      await db.getConnection();

    try {

      // ------------------------------------------------
      // START TRANSACTION
      // ------------------------------------------------

      await connection.beginTransaction();


      // ------------------------------------------------
      // LOCK COURSE ROW
      //
      // FOR UPDATE prevents two concurrent enrollment
      // requests from checking the same capacity
      // simultaneously.
      // ------------------------------------------------

      const [courseRows] =
        await connection.execute(
          `
          SELECT
            id,
            max_students
          FROM courses
          WHERE id = ?
          FOR UPDATE
          `,
          [courseId]
        );


      if (courseRows.length === 0) {

        const error =
          new Error("COURSE_NOT_FOUND");

        throw error;
      }


      const course =
        courseRows[0];


      // ------------------------------------------------
      // CHECK EXISTING ENROLLMENT
      // ------------------------------------------------

      const [existingRows] =
        await connection.execute(
          `
          SELECT id
          FROM enrollments
          WHERE student_id = ?
          AND course_id = ?
          LIMIT 1
          `,
          [
            studentId,
            courseId,
          ]
        );


      if (existingRows.length > 0) {

        const error =
          new Error("ALREADY_ENROLLED");

        throw error;
      }


      // ------------------------------------------------
      // COUNT CURRENT APPROVED ENROLLMENTS
      // ------------------------------------------------

      const [countRows] =
        await connection.execute(
          `
          SELECT COUNT(*) AS enrolled_count
          FROM enrollments
          WHERE course_id = ?
          `,
          [courseId]
        );


      const enrolledCount =
        Number(countRows[0].enrolled_count);


      // ------------------------------------------------
      // CAPACITY CHECK
      //
      // NULL = unlimited
      // ------------------------------------------------

      if (
        course.max_students !== null &&
        enrolledCount >=
          Number(course.max_students)
      ) {

        const error =
          new Error("COURSE_FULL");

        throw error;
      }


      // ------------------------------------------------
      // INSERT ENROLLMENT
      // ------------------------------------------------

      const [result] =
        await connection.execute(
          `
          INSERT INTO enrollments
          (
            student_id,
            course_id
          )
          VALUES (?, ?)
          `,
          [
            studentId,
            courseId,
          ]
        );


      // ------------------------------------------------
      // COMMIT
      // ------------------------------------------------

      await connection.commit();


      return result.insertId;

    } catch (error) {

      // ------------------------------------------------
      // ROLLBACK
      // ------------------------------------------------

      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Rollback error:",
          rollbackError.message
        );
      }


      throw error;

    } finally {

      // ------------------------------------------------
      // RELEASE CONNECTION
      // ------------------------------------------------

      connection.release();
    }
  },


  // ====================================================
  // CHECK EXISTING ENROLLMENT
  // ====================================================

  async findByStudentAndCourse(
    studentId,
    courseId
  ) {

    const [rows] =
      await db.execute(
        `
        SELECT *
        FROM enrollments
        WHERE student_id = ?
        AND course_id = ?
        `,
        [
          studentId,
          courseId,
        ]
      );


    return rows[0];
  },


  // ====================================================
  // GET MY ENROLLMENTS
  // ====================================================

  async getByStudent(studentId) {

    const [rows] =
      await db.execute(
        `
        SELECT
          e.id,
          e.enrolled_at,

          c.id AS course_id,
          c.title,
          c.category,
          c.level,
          c.duration,
          c.price,
          c.image,
          c.description,

          c.max_students,

          (
            SELECT COUNT(*)
            FROM enrollments e2
            WHERE e2.course_id = c.id
          ) AS enrolled_count,

          CASE
            WHEN c.max_students IS NULL
              THEN NULL
            ELSE
              c.max_students -
              (
                SELECT COUNT(*)
                FROM enrollments e3
                WHERE e3.course_id = c.id
              )
          END AS seats_remaining,

          CASE
            WHEN c.max_students IS NULL
              THEN FALSE
            WHEN
              (
                SELECT COUNT(*)
                FROM enrollments e4
                WHERE e4.course_id = c.id
              ) >= c.max_students
              THEN TRUE
            ELSE FALSE
          END AS is_full

        FROM enrollments e

        JOIN courses c
          ON e.course_id = c.id

        WHERE e.student_id = ?

        ORDER BY e.enrolled_at DESC
        `,
        [studentId]
      );


    return rows;
  },


  // ====================================================
  // GET COURSE ENROLLMENTS
  // ====================================================

  async getByCourse(courseId) {

    const [rows] =
      await db.execute(
        `
        SELECT
          e.id,
          e.enrolled_at,

          u.id AS student_id,
          u.username,
          u.full_name

        FROM enrollments e

        JOIN users u
          ON e.student_id = u.id

        WHERE e.course_id = ?

        ORDER BY e.enrolled_at DESC
        `,
        [courseId]
      );


    return rows;
  },


  // ====================================================
  // GET ALL ENROLLMENTS
  // ====================================================

  async getAll() {

    const [rows] =
      await db.execute(
        `
        SELECT
          e.id,
          e.enrolled_at,

          u.id AS student_id,
          u.username,
          u.full_name,

          c.id AS course_id,
          c.title,
          c.category,
          c.level,
          c.max_students,

          (
            SELECT COUNT(*)
            FROM enrollments e2
            WHERE e2.course_id = c.id
          ) AS enrolled_count

        FROM enrollments e

        JOIN users u
          ON e.student_id = u.id

        JOIN courses c
          ON e.course_id = c.id

        ORDER BY e.enrolled_at DESC
        `
      );


    return rows;
  },


  // ====================================================
  // ADMIN DELETE
  // ====================================================

  async delete(id) {

    const [result] =
      await db.execute(
        `
        DELETE FROM enrollments
        WHERE id = ?
        `,
        [id]
      );


    return result;
  },


  // ====================================================
  // STUDENT DELETE
  // ====================================================

  async deleteByStudent(
    enrollmentId,
    studentId
  ) {

    const [result] =
      await db.execute(
        `
        DELETE FROM enrollments
        WHERE id = ?
        AND student_id = ?
        `,
        [
          enrollmentId,
          studentId,
        ]
      );


    return result;
  },

};


module.exports = Enrollment;