USE course_management;

ALTER TABLE enrollments
  ADD COLUMN status ENUM('pending', 'approved', 'rejected') NULL DEFAULT NULL
    AFTER enrolled_at,
  ADD COLUMN reviewed_by INT NULL AFTER status,
  ADD COLUMN reviewed_at TIMESTAMP NULL AFTER reviewed_by,
  ADD COLUMN decision_note TEXT NULL AFTER reviewed_at;

UPDATE enrollments
SET status = 'approved'
WHERE status IS NULL;

ALTER TABLE enrollments
  MODIFY COLUMN status ENUM('pending', 'approved', 'rejected')
    NOT NULL DEFAULT 'pending',
  ADD CONSTRAINT fk_enrollments_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

SET @drop_legacy_enrollment_unique = (
  SELECT CONCAT(
    'ALTER TABLE enrollments DROP INDEX `',
    index_name,
    '`'
  )
  FROM (
    SELECT index_name,
           GROUP_CONCAT(column_name ORDER BY seq_in_index) AS index_columns
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'enrollments'
      AND non_unique = 0
    GROUP BY index_name
  ) AS enrollment_indexes
  WHERE index_columns = 'student_id,course_id'
  LIMIT 1
);

SET @drop_legacy_enrollment_unique =
  COALESCE(@drop_legacy_enrollment_unique, 'SELECT 1');
PREPARE drop_legacy_enrollment_unique_stmt
  FROM @drop_legacy_enrollment_unique;
EXECUTE drop_legacy_enrollment_unique_stmt;
DEALLOCATE PREPARE drop_legacy_enrollment_unique_stmt;

ALTER TABLE enrollments
  ADD COLUMN active_course_id INT
    GENERATED ALWAYS AS (
      CASE
        WHEN status IN ('pending', 'approved') THEN course_id
        ELSE NULL
      END
    ) STORED,
  ADD UNIQUE KEY uq_enrollments_active_student_course
    (student_id, active_course_id),
  ADD INDEX idx_enrollments_course_status (course_id, status),
  ADD INDEX idx_enrollments_student_status (student_id, status);
