import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useParams
} from "react-router-dom";

import {
  FaChartBar,
  FaGraduationCap,
  FaShoppingCart,
  FaSignInAlt
} from "react-icons/fa";

import api from "../services/api";

import {
  isLoggedIn,
  isStudent,
  isAdmin
} from "../services/auth";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


function CourseDetails() {

  const { id } = useParams();

  const location = useLocation();


  // ====================================================
  // STATE
  // ====================================================

  const [course, setCourse] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [enrolling, setEnrolling] = useState(false);

  const [enrolled, setEnrolled] = useState(false);


  // ====================================================
  // LOGIN / ROLE
  // ====================================================

  const loggedIn = isLoggedIn();

  const studentLoggedIn = isStudent();

  const adminLoggedIn = isAdmin();


  // ====================================================
  // CAPACITY
  // ====================================================

  const hasCapacityLimit =
    course &&
    course.max_students !== null &&
    course.max_students !== undefined;


  const enrolledCount =
    course?.enrolled_count !== null &&
    course?.enrolled_count !== undefined
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
      course?.is_full === true ||
      seatsRemaining <= 0
    );


  // ====================================================
  // LOAD COURSE + ENROLLMENT STATE
  // ====================================================

  useEffect(() => {

    const getCourse = async () => {

      try {

        setLoading(true);

        setError("");

        setSuccess("");


        // ------------------------------------------------
        // Get course
        // ------------------------------------------------

        const response =
          await api.get(
            `/courses/${id}`
          );


        const loadedCourse =
          response.data.course;


        setCourse(
          loadedCourse
        );


        // ------------------------------------------------
        // Check student's enrollment
        // ------------------------------------------------

        if (studentLoggedIn) {

          try {

            const enrollmentResponse =
              await api.get(
                "/enrollments/my"
              );


            const myEnrollments =
              Array.isArray(
                enrollmentResponse
                  .data
                  .enrollments
              )
                ? enrollmentResponse
                    .data
                    .enrollments
                : [];


            const isCurrentlyEnrolled =
              myEnrollments.some(
                (enrollment) =>
                  Number(
                    enrollment.course_id
                  ) === Number(id)
              );


            setEnrolled(
              isCurrentlyEnrolled
            );

          } catch (enrollmentError) {

            console.error(
              "Error checking enrollment:",
              enrollmentError.message
            );

            setEnrolled(false);

          }

        } else {

          setEnrolled(false);

        }

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load course"
        );

      } finally {

        setLoading(false);

      }

    };


    getCourse();

  }, [
    id,
    studentLoggedIn
  ]);


  // ====================================================
  // ENROLL
  // ====================================================

  const handleEnroll = async () => {

    setError("");

    setSuccess("");

    setEnrolling(true);


    try {

      const response =
        await api.post(
          "/enrollments",
          {
            courseId: id,
          }
        );


      setSuccess(
        response.data.message
      );


      // Student is now enrolled
      setEnrolled(true);


      // ------------------------------------------------
      // Refresh course capacity
      // ------------------------------------------------

      try {

        const courseResponse =
          await api.get(
            `/courses/${id}`
          );


        setCourse(
          courseResponse.data.course
        );

      } catch (refreshError) {

        console.error(
          "Failed to refresh course availability:",
          refreshError.message
        );

      }

    } catch (error) {

      // ------------------------------------------------
      // COURSE FULL
      // ------------------------------------------------

      if (
        error.response?.status === 409 &&
        error.response?.data?.message
          ?.toLowerCase()
          .includes("full")
      ) {

        setError(
          error.response.data.message
        );

        // Refresh availability because
        // another student may have taken
        // the final seat.

        try {

          const courseResponse =
            await api.get(
              `/courses/${id}`
            );


          setCourse(
            courseResponse.data.course
          );

        } catch (refreshError) {

          console.error(
            "Failed to refresh course availability:",
            refreshError.message
          );

        }

      }

      // ------------------------------------------------
      // ALREADY ENROLLED
      // ------------------------------------------------

      else if (
        error.response?.status === 409
      ) {

        setEnrolled(true);

        setError(
          "You are already enrolled in this course. You can see it in My Enrollments."
        );

      }

      // ------------------------------------------------
      // OTHER ERROR
      // ------------------------------------------------

      else {

        setError(
          error.response?.data?.message ||
          "Enrollment failed. Please try again."
        );

      }

    } finally {

      setEnrolling(false);

    }

  };


  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {

    return (

      <>

        <Navbar />

        <div className="container">

          <p className="loading">

            Loading course...

          </p>

        </div>

        <Footer />

      </>

    );

  }


  // ====================================================
  // COURSE NOT FOUND
  // ====================================================

  if (error && !course) {

    return (

      <>

        <Navbar />

        <div className="container">

          <p className="error">

            {error}

          </p>


          <div className="center-actions">

            <Link
              to="/courses"
              className="btn btn-primary"
            >

              Back to Courses

            </Link>

          </div>

        </div>

        <Footer />

      </>

    );

  }


  // ====================================================
  // PAGE
  // ====================================================

  return (

    <>

      <Navbar />


      <div className="container">


        {/* ==================================================
            BREADCRUMB
        ================================================== */}

        <p className="breadcrumb">

          <Link to="/courses">

            Courses

          </Link>

          <span> / </span>

          <span>

            {course.title}

          </span>

        </p>



        <div className="details-layout">


          {/* ==================================================
              COURSE IMAGE
          ================================================== */}

          <div className="details-image-wrapper">

            <img
              src={course.image}
              alt={course.title}
              className="details-image"
            />

          </div>



          {/* ==================================================
              COURSE INFORMATION
          ================================================== */}

          <div className="details-info">


            {/* Tags */}

            <div className="course-card-tags">

              <span className="tag tag-category">

                {course.category}

              </span>


              <span className="tag tag-level">

                {course.level}

              </span>

            </div>



            {/* Title */}

            <h1>

              {course.title}

            </h1>



            {/* Description */}

            <p className="details-description">

              {course.description}

            </p>



            {/* ==================================================
                COURSE INFORMATION
            ================================================== */}

            <dl className="details-list">


              <div>

                <dt>
                  Category
                </dt>

                <dd>
                  {course.category}
                </dd>

              </div>


              <div>

                <dt>
                  Level
                </dt>

                <dd>
                  {course.level}
                </dd>

              </div>


              <div>

                <dt>
                  Duration
                </dt>

                <dd>
                  {course.duration}
                </dd>

              </div>


              <div>

                <dt>
                  Price
                </dt>

                <dd className="details-price">

                  Rs. {course.price}

                </dd>

              </div>


              {/* ==================================================
                  ENROLLMENT / CAPACITY
              ================================================== */}

              <div>

                <dt>
                  Enrollment
                </dt>

                <dd>

                  {hasCapacityLimit ? (

                    <>

                      <strong>
                        {enrolledCount} / {maxStudents}
                      </strong>

                      {" students"}

                    </>

                  ) : (

                    <strong>
                      Unlimited
                    </strong>

                  )}

                </dd>

              </div>


              {/* ==================================================
                  SEATS REMAINING
              ================================================== */}

              <div>

                <dt>
                  Availability
                </dt>

                <dd>

                  {hasCapacityLimit ? (

                    isFull ? (

                      <span className="error">

                        Course Full

                      </span>

                    ) : (

                      <span className="success">

                        {seatsRemaining}{" "}
                        {seatsRemaining === 1
                          ? "seat"
                          : "seats"}{" "}
                        remaining

                      </span>

                    )

                  ) : (

                    <span className="success">

                      Unlimited

                    </span>

                  )}

                </dd>

              </div>


            </dl>



            {/* ==================================================
                FULL COURSE NOTICE
            ================================================== */}

            {isFull && !enrolled && (

              <div className="notice">

                <p className="error">

                  <strong>
                    Course Full
                  </strong>
                </p>

                <p>

                  This course has reached its
                  maximum enrollment capacity.
                  No seats are currently available.

                </p>

              </div>

            )}



            {/* ==================================================
                SUCCESS MESSAGE
            ================================================== */}

            {success && (

              <p className="success">

                {success}

              </p>

            )}



            {/* ==================================================
                ERROR MESSAGE
            ================================================== */}

            {error && (

              <p className="error">

                {error}

              </p>

            )}



            {/* ==================================================
                ACTIONS
            ================================================== */}

            <div className="details-actions">


              {/* ==================================================
                  NOT LOGGED IN
              ================================================== */}

              {!loggedIn && (

                <div className="notice">

                  <p>

                    Please login as a student
                    to enroll in this course.

                  </p>


                  <Link
                    to="/login"
                    state={{
                      from:
                        location.pathname
                    }}
                    className="btn btn-primary"
                  >

                    <FaSignInAlt />

                    Login to Enroll

                  </Link>

                </div>

              )}



              {/* ==================================================
                  STUDENT
              ================================================== */}

              {studentLoggedIn && (

                <>

                  {/* ----------------------------------------------
                      ALREADY ENROLLED
                  ---------------------------------------------- */}

                  {enrolled ? (

                    <div className="notice">

                      <p className="success">

                        You are currently
                        enrolled in this course.

                      </p>


                      <Link
                        to="/my-enrollments"
                        className="btn btn-primary"
                      >

                        <FaGraduationCap />

                        My Enrollments

                      </Link>

                    </div>

                  ) : isFull ? (

                    /* --------------------------------------------
                       COURSE FULL
                    -------------------------------------------- */

                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      disabled
                    >

                      <FaShoppingCart />

                      Course Full

                    </button>

                  ) : (

                    /* --------------------------------------------
                       AVAILABLE
                    -------------------------------------------- */

                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      onClick={handleEnroll}
                      disabled={enrolling}
                    >

                      <FaShoppingCart />

                      {enrolling
                        ? "Enrolling..."
                        : "Enroll Now"}

                    </button>

                  )}


                  {/* My Enrollments link */}

                  <Link
                    to="/my-enrollments"
                    className="btn btn-outline"
                  >

                    <FaGraduationCap />

                    My Enrollments

                  </Link>

                </>

              )}



              {/* ==================================================
                  ADMIN
              ================================================== */}

              {adminLoggedIn && (

                <div className="notice">

                  <p>

                    You are logged in as an
                    administrator. Only students
                    can enroll in courses.

                  </p>


                  <Link
                    to="/admin/courses"
                    className="btn btn-primary"
                  >

                    <FaChartBar />

                    Manage Courses

                  </Link>

                </div>

              )}


            </div>


          </div>

        </div>

      </div>


      <Footer />

    </>

  );

}


export default CourseDetails;