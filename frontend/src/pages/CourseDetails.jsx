import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useParams
} from "react-router-dom";

import {
  FaChartBar,
  FaCheckCircle,
  FaClock,
  FaGraduationCap,
  FaPaperPlane,
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


// Format a date for display
const formatDate = (value) => {

  if (!value) {
    return "-";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString();

};


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

  // CR-011: this student's request for this course
  // null | { status, decision_note, reviewed_at }
  const [myRequest, setMyRequest] = useState(null);

  const enrollmentStatus = myRequest?.status || null;



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


            // CR-011: find the request (any status)
            const existingRequest =
              myEnrollments.find(
                (enrollment) =>
                  Number(
                    enrollment.course_id
                  ) === Number(id)
              );


            setMyRequest(
              existingRequest || null
            );

          } catch (enrollmentError) {

            console.error(
              "Error checking enrollment:",
              enrollmentError.message
            );

            setMyRequest(null);

          }

        } else {

          setMyRequest(null);

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
  // REFRESH COURSE (capacity)
  // ====================================================

  const refreshCourse = async () => {

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

  };


  // ====================================================
  // REQUEST ENROLLMENT (CR-011)
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


      // The request is now waiting for an administrator.
      // The student is NOT enrolled yet.
      setMyRequest({
        status: "pending",
        decision_note: null,
        reviewed_at: null,
      });


      // Pending requests do not use a seat,
      // but refresh anyway to stay accurate.
      await refreshCourse();

    } catch (error) {

      const data =
        error.response?.data;

      const message =
        data?.message || "";


      if (error.response?.status === 409) {

        // ------------------------------------------------
        // ALREADY PENDING / ALREADY APPROVED
        // ------------------------------------------------

        if (
          data?.currentStatus === "pending" ||
          data?.currentStatus === "approved"
        ) {

          setMyRequest({
            status: data.currentStatus,
            decision_note: null,
            reviewed_at: null,
          });

          setError(message);

        }

        // ------------------------------------------------
        // COURSE FULL
        // ------------------------------------------------

        else if (
          message
            .toLowerCase()
            .includes("full")
        ) {

          setError(message);

          // Refresh availability because
          // seats may have changed.
          await refreshCourse();

        }

        // ------------------------------------------------
        // OTHER CONFLICT
        // ------------------------------------------------

        else {

          setError(
            message ||
            "Could not submit the request. Please try again."
          );

        }

      }

      // ------------------------------------------------
      // OTHER ERROR
      // ------------------------------------------------

      else {

        setError(
          message ||
          "Request failed. Please try again."
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

            {isFull &&
              (enrollmentStatus === null ||
                enrollmentStatus === "rejected") && (

              <div className="notice">

                <p className="error">

                  <strong>
                    Course At Capacity
                  </strong>
                </p>

                <p>

                  The course has no approved seats available right now.
                  You may still request enrollment, but approval depends on
                  an available seat.

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
                    to request enrollment in this course.

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

                    Login to Request Enrollment

                  </Link>

                </div>

              )}



              {/* ==================================================
                  STUDENT
              ================================================== */}

              {studentLoggedIn && (

                <>

                  {/* ----------------------------------------------
                      CR-011: APPROVED = enrolled
                  ---------------------------------------------- */}

                  {enrollmentStatus === "approved" ? (

                    <div className="request-status-box status-box-approved">

                      <p className="success">

                        <FaCheckCircle />{" "}

                        You are currently
                        enrolled in this course.

                      </p>

                      {myRequest.reviewed_at && (

                        <span className="decision-meta">

                          Approved on{" "}
                          {formatDate(
                            myRequest.reviewed_at
                          )}

                        </span>

                      )}

                    </div>

                  ) : enrollmentStatus === "pending" ? (

                    /* --------------------------------------------
                       CR-011: PENDING
                    -------------------------------------------- */

                    <div className="request-status-box status-box-pending">

                      <p>

                        <span className="status-badge status-pending">

                          <FaClock />{" "}

                          Request Pending Approval

                        </span>

                      </p>

                      <p>

                        Your enrollment request has been sent.
                        An administrator will approve or reject
                        it. No seat is reserved until it is
                        approved.

                      </p>

                    </div>

                  ) : (

                    <>

                      {/* ------------------------------------------
                          CR-011: REJECTED (reason + decision date)
                      ------------------------------------------ */}

                      {enrollmentStatus === "rejected" && (

                        <div className="request-status-box status-box-rejected">

                          <p>

                            <span className="status-badge status-rejected">
                              Request Rejected
                            </span>

                          </p>

                          {myRequest.decision_note && (

                            <p className="decision-note">

                              <strong>Reason:</strong>{" "}

                              {myRequest.decision_note}

                            </p>

                          )}

                          <span className="decision-meta">

                            Decision date:{" "}

                            {formatDate(
                              myRequest.reviewed_at
                            )}

                          </span>

                          <p>

                            You can submit a new request.

                          </p>

                        </div>

                      )}


                      <button
                        type="button"
                        className="btn btn-primary btn-lg"
                        onClick={handleEnroll}
                        disabled={enrolling}
                      >

                        <FaPaperPlane />

                        {enrolling
                          ? "Submitting request..."
                          : enrollmentStatus === "rejected"
                            ? "Request Enrollment Again"
                            : "Request Enrollment"}

                      </button>

                    </>

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