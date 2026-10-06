import { Link } from "react-router-dom";
import { FaEye } from "react-icons/fa";

function CourseCard({ course }) {

  // ====================================================
  // CAPACITY / AVAILABILITY
  // ====================================================

  const hasCapacityLimit =
    course.max_students !== null &&
    course.max_students !== undefined;


  const enrolledCount =
    course.enrolled_count !== null &&
    course.enrolled_count !== undefined
      ? Number(course.enrolled_count)
      : 0;


  const maxStudents =
    hasCapacityLimit
      ? Number(course.max_students)
      : null;


  const seatsRemaining =
    hasCapacityLimit
      ? Math.max(
          maxStudents - enrolledCount,
          0
        )
      : null;


  const isFull =
    hasCapacityLimit &&
    (
      course.is_full === true ||
      seatsRemaining <= 0
    );


  return (

    <article className="course-card">

      {/* ==================================================
          COURSE IMAGE
      ================================================== */}

      <img
        src={course.image}
        alt={course.title}
        className="course-card-image"
        loading="lazy"
      />


      <div className="course-card-body">


        {/* ==================================================
            TAGS
        ================================================== */}

        <div className="course-card-tags">

          <span className="tag tag-category">
            {course.category}
          </span>

          <span className="tag tag-level">
            {course.level}
          </span>

          {/* Full badge */}

          {isFull && (
            <span className="tag tag-full">
              Course Full
            </span>
          )}

        </div>


        {/* ==================================================
            TITLE
        ================================================== */}

        <h3 className="course-card-title">
          {course.title}
        </h3>


        {/* ==================================================
            DESCRIPTION
        ================================================== */}

        <p className="course-card-summary">

          {course.description?.slice(0, 110)}

          {course.description?.length > 110
            ? "..."
            : ""}

        </p>


        {/* ==================================================
            COURSE META
        ================================================== */}

        <ul className="course-card-meta">

          <li>
            <strong>Duration:</strong>{" "}
            {course.duration}
          </li>


          <li>
            <strong>Price:</strong>{" "}
            Rs. {course.price}
          </li>


          {/* ==================================================
              ENROLLMENT CAPACITY
          ================================================== */}

          <li>

            <strong>Enrollment:</strong>{" "}

            {hasCapacityLimit ? (

              <>
                {enrolledCount} / {maxStudents} students
              </>

            ) : (

              "Unlimited"

            )}

          </li>


          {/* ==================================================
              AVAILABILITY
          ================================================== */}

          <li>

            <strong>Availability:</strong>{" "}

            {hasCapacityLimit ? (

              isFull ? (

                <span className="course-full-text">
                  Course Full
                </span>

              ) : (

                <span className="course-available-text">

                  {seatsRemaining}{" "}

                  {seatsRemaining === 1
                    ? "seat"
                    : "seats"}{" "}
                  remaining

                </span>

              )

            ) : (

              <span className="course-available-text">
                Unlimited
              </span>

            )}

          </li>

        </ul>


        {/* ==================================================
            VIEW DETAILS
        ================================================== */}

        <Link
          to={`/courses/${course.id}`}
          className="btn btn-primary btn-block"
        >

          <FaEye />

          View Details

        </Link>


      </div>

    </article>

  );

}


export default CourseCard;