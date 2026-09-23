const db = require("../config/db");

const Course = {

  // Get all courses
  async getAll() {
    const [rows] = await db.execute(
      "SELECT * FROM courses"
    );

    return rows;
  },


  // Get one course
  async getById(id) {
    const [rows] = await db.execute(
      "SELECT * FROM courses WHERE id = ?",
      [id]
    );

    return rows[0];
  },


  // Find course by title
  // excludeId is used during update so the course
  // can keep its own existing title.
  async findByTitle(title, excludeId = null) {

    let query = `
      SELECT id, title
      FROM courses
      WHERE LOWER(TRIM(title)) = LOWER(TRIM(?))
    `;

    const params = [title];

    if (excludeId !== null) {
      query += " AND id != ?";
      params.push(excludeId);
    }

    query += " LIMIT 1";

    const [rows] = await db.execute(query, params);

    return rows[0];
  },


  // Create course
  async create(course) {

    const {
      title,
      category,
      level,
      duration,
      price,
      image,
      description,
    } = course;

    const [result] = await db.execute(
      `INSERT INTO courses
       (title, category, level, duration, price, image, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        category,
        level,
        duration,
        price,
        image,
        description,
      ]
    );

    return result.insertId;
  },


  // Update course
  async update(id, course) {

    const {
      title,
      category,
      level,
      duration,
      price,
      image,
      description,
    } = course;

    const [result] = await db.execute(
      `UPDATE courses
       SET title = ?,
           category = ?,
           level = ?,
           duration = ?,
           price = ?,
           image = ?,
           description = ?
       WHERE id = ?`,
      [
        title,
        category,
        level,
        duration,
        price,
        image,
        description,
        id,
      ]
    );

    return result;
  },


  // Delete course
  async delete(id) {

    const [result] = await db.execute(
      "DELETE FROM courses WHERE id = ?",
      [id]
    );

    return result;
  },

};

module.exports = Course;