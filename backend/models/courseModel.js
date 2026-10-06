const db = require("../config/db");

const Course = {

  // ======================================================
  // GET ALL COURSES
  // ======================================================

  async getAll() {

    const [rows] = await db.execute(
      `
      SELECT
        c.*,

        COUNT(e.id) AS enrolled_count,

        CASE
          WHEN c.max_students IS NULL
            THEN NULL
          ELSE c.max_students - COUNT(e.id)
        END AS seats_remaining,

        CASE
          WHEN c.max_students IS NULL
            THEN FALSE
          WHEN COUNT(e.id) >= c.max_students
            THEN TRUE
          ELSE FALSE
        END AS is_full

      FROM courses c

      LEFT JOIN enrollments e
        ON c.id = e.course_id

      GROUP BY c.id

      ORDER BY c.id ASC
      `
    );

    return rows;
  },


  // ======================================================
  // GET ONE COURSE
  // ======================================================

  async getById(id) {

    const [rows] = await db.execute(
      `
      SELECT
        c.*,

        COUNT(e.id) AS enrolled_count,

        CASE
          WHEN c.max_students IS NULL
            THEN NULL
          ELSE c.max_students - COUNT(e.id)
        END AS seats_remaining,

        CASE
          WHEN c.max_students IS NULL
            THEN FALSE
          WHEN COUNT(e.id) >= c.max_students
            THEN TRUE
          ELSE FALSE
        END AS is_full

      FROM courses c

      LEFT JOIN enrollments e
        ON c.id = e.course_id

      WHERE c.id = ?

      GROUP BY c.id
      `,
      [id]
    );

    return rows[0];
  },


  // ======================================================
  // FIND COURSE BY TITLE
  // ======================================================

  async findByTitle(title, excludeId = null) {

    let query = `
      SELECT
        id,
        title
      FROM courses
      WHERE LOWER(TRIM(title)) =
            LOWER(TRIM(?))
    `;

    const params = [title];

    if (excludeId !== null) {

      query += " AND id != ?";

      params.push(excludeId);
    }

    query += " LIMIT 1";

    const [rows] =
      await db.execute(
        query,
        params
      );

    return rows[0];
  },


  // ======================================================
  // CREATE COURSE
  // ======================================================

  async create(course) {

    const {
      title,
      category,
      level,
      duration,
      price,
      image,
      description,
      max_students,
    } = course;


    const [result] =
      await db.execute(
        `
        INSERT INTO courses
        (
          title,
          category,
          level,
          duration,
          price,
          image,
          description,
          max_students
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          title,
          category,
          level,
          duration,
          price,
          image,
          description,
          max_students,
        ]
      );


    return result.insertId;
  },


  // ======================================================
  // UPDATE COURSE
  // ======================================================

  async update(id, course) {

    const {
      title,
      category,
      level,
      duration,
      price,
      image,
      description,
      max_students,
    } = course;


    const [result] =
      await db.execute(
        `
        UPDATE courses
        SET
          title = ?,
          category = ?,
          level = ?,
          duration = ?,
          price = ?,
          image = ?,
          description = ?,
          max_students = ?
        WHERE id = ?
        `,
        [
          title,
          category,
          level,
          duration,
          price,
          image,
          description,
          max_students,
          id,
        ]
      );


    return result;
  },


  // ======================================================
  // DELETE COURSE
  // ======================================================

  async delete(id) {

    const [result] =
      await db.execute(
        `
        DELETE FROM courses
        WHERE id = ?
        `,
        [id]
      );

    return result;
  },


  // ======================================================
  // GET APPROVED ENROLLMENT COUNT
  // ======================================================

  async getEnrollmentCount(id) {

    const [rows] =
      await db.execute(
        `
        SELECT COUNT(*) AS enrolled_count
        FROM enrollments
        WHERE course_id = ?
        `,
        [id]
      );

    return Number(rows[0].enrolled_count);
  },

};


module.exports = Course;