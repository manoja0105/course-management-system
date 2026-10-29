const db = require("../config/db");

/*
 * CR-009 - Reporting model
 *
 * Every statistic is calculated by MySQL using aggregation
 * (COUNT / SUM / MIN / MAX / GROUP BY). No query is executed
 * inside a loop, so the number of queries is fixed
 * (6 for admin, 2 for student) no matter how many courses exist.
 *
 * CR-011 DECISION (pending enrollments):
 * The current schema has no enrollment status column, so every
 * enrollment row is counted. If CR-011 adds a status column,
 * only APPROVED enrollments must be counted in reports. To do that,
 * change COUNTED_ENROLLMENT below to "e.status = 'approved'"
 * (single place - used by every query in this file).
 */
const COUNTED_ENROLLMENT = "1 = 1";

// Convert any DB value (string / BigInt / null) into a safe number.
const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const Report = {
  // ======================================================
  // ADMIN OVERVIEW
  // ======================================================
  async getAdminOverview() {
    const [
      [courseRows],
      [studentRows],
      [enrollmentRows],
      [noEnrollmentRows],
      [categoryRows],
      [topCourseRows],
    ] = await Promise.all([
      // 1. Total courses
      db.execute(`SELECT COUNT(*) AS total FROM courses`),

      // 2. Total students
      db.execute(
        `SELECT COUNT(*) AS total
         FROM users
         WHERE role = 'student'`
      ),

      // 3, 4, 5. Enrollment totals in ONE aggregate query
      db.execute(
        `SELECT
           COUNT(*)                    AS total_enrollments,
           COUNT(DISTINCT e.student_id) AS students_with_enrollments,
           COALESCE(SUM(
             e.enrolled_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
           ), 0)                       AS last_30_days
         FROM enrollments e
         WHERE ${COUNTED_ENROLLMENT}`
      ),

      // 8. Courses with no enrollments
      db.execute(
        `SELECT COUNT(*) AS total
         FROM courses c
         WHERE NOT EXISTS (
           SELECT 1
           FROM enrollments e
           WHERE e.course_id = c.id
             AND ${COUNTED_ENROLLMENT}
         )`
      ),

      // 6. Enrollments by category (LEFT JOIN keeps empty categories)
      db.execute(
        `SELECT
           c.category,
           COUNT(DISTINCT c.id) AS course_count,
           COUNT(e.id)          AS enrollment_count
         FROM courses c
         LEFT JOIN enrollments e
           ON e.course_id = c.id
          AND ${COUNTED_ENROLLMENT}
         GROUP BY c.category
         ORDER BY enrollment_count DESC, c.category ASC`
      ),

      // 7. Top five courses (ties broken by title, then id)
      db.execute(
        `SELECT
           c.id,
           c.title,
           c.category,
           COUNT(e.id) AS enrollment_count
         FROM courses c
         JOIN enrollments e
           ON e.course_id = c.id
          AND ${COUNTED_ENROLLMENT}
         GROUP BY c.id, c.title, c.category
         ORDER BY enrollment_count DESC, c.title ASC, c.id ASC
         LIMIT 5`
      ),
    ]);

    const enrollment = enrollmentRows[0] || {};

    return {
      totalCourses: toNumber(courseRows[0]?.total),
      totalStudents: toNumber(studentRows[0]?.total),
      totalEnrollments: toNumber(enrollment.total_enrollments),
      studentsWithEnrollments: toNumber(
        enrollment.students_with_enrollments
      ),
      enrollmentsLast30Days: toNumber(enrollment.last_30_days),
      coursesWithoutEnrollments: toNumber(
        noEnrollmentRows[0]?.total
      ),
      enrollmentsByCategory: categoryRows.map((row) => ({
        category: row.category,
        courseCount: toNumber(row.course_count),
        enrollmentCount: toNumber(row.enrollment_count),
      })),
      topCourses: topCourseRows.map((row) => ({
        courseId: row.id,
        title: row.title,
        category: row.category,
        enrollmentCount: toNumber(row.enrollment_count),
      })),
    };
  },

  // ======================================================
  // STUDENT REPORT
  // studentId always comes from the verified JWT (req.user.id),
  // never from the URL or request body.
  // ======================================================
  async getStudentReport(studentId) {
    const [[summaryRows], [recentRows]] = await Promise.all([
      db.execute(
        `SELECT
           COUNT(*)                   AS enrolled_courses,
           COUNT(DISTINCT c.category) AS distinct_categories,
           MIN(e.enrolled_at)         AS earliest_enrollment,
           MAX(e.enrolled_at)         AS latest_enrollment,
           COALESCE(SUM(c.price), 0)  AS total_value
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         WHERE e.student_id = ?
           AND ${COUNTED_ENROLLMENT}`,
        [studentId]
      ),

      db.execute(
        `SELECT
           e.id,
           e.enrolled_at,
           c.id AS course_id,
           c.title,
           c.category,
           c.level
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         WHERE e.student_id = ?
           AND ${COUNTED_ENROLLMENT}
         ORDER BY e.enrolled_at DESC, e.id DESC
         LIMIT 5`,
        [studentId]
      ),
    ]);

    const summary = summaryRows[0] || {};

    return {
      enrolledCourses: toNumber(summary.enrolled_courses),
      distinctCategories: toNumber(summary.distinct_categories),
      earliestEnrollmentDate: summary.earliest_enrollment || null,
      latestEnrollmentDate: summary.latest_enrollment || null,
      totalEnrollmentValue: toNumber(summary.total_value),
      recentEnrollments: recentRows.map((row) => ({
        id: row.id,
        enrolledAt: row.enrolled_at,
        courseId: row.course_id,
        title: row.title,
        category: row.category,
        level: row.level,
      })),
    };
  },
};

module.exports = Report;