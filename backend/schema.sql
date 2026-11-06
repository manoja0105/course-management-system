CREATE DATABASE IF NOT EXISTS course_management;

USE course_management;


-- ======================================================
-- USERS
-- ======================================================

CREATE TABLE IF NOT EXISTS users (

    id INT AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(50) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL,

    full_name VARCHAR(100) NOT NULL,

    role ENUM('admin', 'student') NOT NULL

);


-- ======================================================
-- COURSES
-- ======================================================

CREATE TABLE IF NOT EXISTS courses (

    id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(100) NOT NULL,

    category VARCHAR(50) NOT NULL,

    level VARCHAR(30) NOT NULL,

    duration VARCHAR(30) NOT NULL,

    price DECIMAL(10, 2) NOT NULL,

    image VARCHAR(500),

    description TEXT,

    -- NULL = unlimited capacity
    max_students INT NULL

);


-- ======================================================
-- ENROLLMENTS
-- ======================================================

CREATE TABLE IF NOT EXISTS enrollments (

    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    course_id INT NOT NULL,

    -- Date the request was submitted
    enrolled_at TIMESTAMP
      DEFAULT CURRENT_TIMESTAMP,

    -- CR-011: approval workflow
    -- pending -> approved | rejected
    status ENUM('pending', 'approved', 'rejected')
      NOT NULL DEFAULT 'pending',

    -- Administrator who made the decision (NULL while pending)
    reviewed_by INT NULL,

    reviewed_at TIMESTAMP NULL DEFAULT NULL,

    -- Rejection reason (required when rejected) / optional approval note
    decision_note VARCHAR(500) NULL,

    -- One row per student + course.
    -- A rejected request is re-submitted by resetting this same row to pending.
    UNIQUE (student_id, course_id),

    -- Capacity counts / reports / admin filter
    INDEX idx_enrollments_course_status (course_id, status),
    INDEX idx_enrollments_status_enrolled (status, enrolled_at),

    -- Student
    FOREIGN KEY (student_id)
      REFERENCES users(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE,

    -- Course
    FOREIGN KEY (course_id)
      REFERENCES courses(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE,

    -- Reviewing administrator
    FOREIGN KEY (reviewed_by)
      REFERENCES users(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE

);