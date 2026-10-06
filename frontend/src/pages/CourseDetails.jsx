import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import {
  FaChartBar,
  FaGraduationCap,
  FaShoppingCart,
  FaSignInAlt,
  FaCheckCircle,
} from "react-icons/fa";

import api from "../services/api";
import {
  isLoggedIn,
  isStudent,
  isAdmin,
} from "../services/auth";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


function CourseDetails() {

  const { id } = useParams();

  const location = useLocation();


  const [course, setCourse] =
    useState(null);


  const [loading, setLoading] =
    useState(true);


  const [error, setError] =
    useState("");


  const [success, setSuccess] =
    useState("");


  const [enrolling, setEnrolling] =
    useState(false);


  /*
   * CR-006
   *
   * Stores whether the logged-in student is
   * currently enrolled in this course.
   */
  const [isEnrolled, setIsEnrolled] =
    useState(false);


  const [checkingEnrollment, setCheckingEnrollment] =
    useState(false);


  // ============================================================
  // Login state
  // ============================================================

  const loggedIn = isLoggedIn();

  const studentLoggedIn = isStudent();

  const adminLoggedIn = isAdmin();


  // ============================================================
  // Load course
  // ============================================================

  useEffect(() => {

    const getCourse = async () => {

      setLoading(true);

      setError("");

      try {

        const response =
          await api.get(`/courses/${id}`);

        setCourse(
          response.data.course
        );

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

  }, [id]);


  // ============================================================
  // CR-006
  // Check student's current enrollment state
  // ============================================================

  useEffect(() => {

    /*
     * Only students need enrollment state.
     */
    if (!studentLoggedIn) {

      setIsEnrolled(false);

      return;

    }


    const checkEnrollment = async () => {

      setCheckingEnrollment(true);


      try {

        const response =
          await api.get("/enrollments/my");


        const enrollments =
          response.data.enrollments || [];


        /*
         * Compare course_id with current course ID.
         */
        const enrolled =
          enrollments.some(
            (enrollment) =>
              String(enrollment.course_id) ===
              String(id)
          );


        setIsEnrolled(enrolled);

      } catch (error) {

        /*
         * We do not show an extra error here because
         * course details can still be displayed.
         */
        console.error(
          "Error checking enrollment state:",
          error.message
        );

        setIsEnrolled(false);

      } finally {

        setCheckingEnrollment(false);

      }

    };


    checkEnrollment();

  }, [id, studentLoggedIn]);


  // ============================================================
  // Enroll
  // ============================================================

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


      /*
       * Course is now enrolled.
       */
      setIsEnrolled(true);

    } catch (error) {

      // 409 = already enrolled
      if (
        error.response?.status === 409
      ) {

        setError(
          "You are already enrolled in this course. You can see it in My Enrollments."
        );

        /*
         * Keep UI state correct.
         */
        setIsEnrolled(true);

      } else {

        setError(
          error.response?.data?.message ||
          "Enrollment failed. Please try again."
        );

      }

    } finally {

      setEnrolling(false);

    }
  };


  // ============================================================
  // Loading
  // ============================================================

  if (loading) {

    return (

      <>
        <Navbar />

        <div className="container">

          <p className="loading">
            Loading course...
          </p>

        </div>
      </>

    );

  }


  // ============================================================
  // Course not found
  // ============================================================

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
      </>

    );

  }


  return (

    <>
      <Navbar />


      <div className="container">

        {/* Breadcrumb */}

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
              Left: Image
              ================================================== */}

          <div className="details-image-wrapper">

            <img
              src={course.image}
              alt={course.title}
              className="details-image"
            />

          </div>


          {/* ==================================================
              Right: Information
              ================================================== */}

          <div className="details-info">


            <div className="course-card-tags">

              <span className="tag tag-category">
                {course.category}
              </span>

              <span className="tag tag-level">
                {course.level}
              </span>

            </div>


            <h1>
              {course.title}
            </h1>


            <p className="details-description">
              {course.description}
            </p>


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

            </dl>


            {/* ==================================================
                Messages
                ================================================== */}

            {success && (
              <p className="success">
                {success}
              </p>
            )}


            {error && (
              <p className="error">
                {error}
              </p>
            )}


            {/* ==================================================
                Action Area
                ================================================== */}

            <div className="details-actions">


              {/* =================================================
                  Not logged in
                  ================================================= */}

              {!loggedIn && (

                <div className="notice">

                  <p>
                    Please login as a student to
                    enroll in this course.
                  </p>


                  <Link
                    to="/login"
                    state={{
                      from: location.pathname
                    }}
                    className="btn btn-primary"
                  >
                    <FaSignInAlt />

                    Login to Enroll
                  </Link>

                </div>

              )}


              {/* =================================================
                  Student
                  ================================================= */}

              {studentLoggedIn && (

                <>

                  {/* Checking current enrollment */}

                  {checkingEnrollment ? (

                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      disabled
                    >
                      Checking Enrollment...
                    </button>

                  ) : isEnrolled ? (

                    /*
                     * CR-006:
                     * Course is currently enrolled.
                     */

                    <>

                      <div className="enrolled-status">

                        <FaCheckCircle />

                        <span>
                          You are currently enrolled
                          in this course.
                        </span>

                      </div>


                      <Link
                        to="/my-enrollments"
                        className="btn btn-outline"
                      >

                        <FaGraduationCap />

                        My Enrollments

                      </Link>

                    </>

                  ) : (

                    /*
                     * Not enrolled.
                     *
                     * This also appears after the student
                     * cancels the enrollment.
                     */

                    <>

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


                      <Link
                        to="/my-enrollments"
                        className="btn btn-outline"
                      >

                        <FaGraduationCap />

                        My Enrollments

                      </Link>

                    </>

                  )}

                </>

              )}


              {/* =================================================
                  Admin
                  ================================================= */}

              {adminLoggedIn && (

                <div className="notice">

                  <p>
                    You are logged in as an administrator.
                    Only students can enroll in courses.
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