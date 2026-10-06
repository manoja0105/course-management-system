import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  FaChartBar,
  FaGraduationCap,
  FaShoppingCart,
  FaSignInAlt,
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

  const [course, setCourse] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [enrolling, setEnrolling] = useState(false);

  const loggedIn = isLoggedIn();
  const studentLoggedIn = isStudent();
  const adminLoggedIn = isAdmin();

  // --------------------------------------------------
  // Load course
  // --------------------------------------------------
  const getCourse = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/courses/${id}`);

      setCourse(response.data.course);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to load course"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCourse();
  }, [id]);

  // --------------------------------------------------
  // Enroll
  // --------------------------------------------------
  const handleEnroll = async () => {
    setError("");
    setSuccess("");
    setEnrolling(true);

    try {
      const response = await api.post("/enrollments", {
        courseId: id,
      });

      setSuccess(
        response.data?.message ||
          "You have successfully enrolled in this course."
      );

      /*
       * Reload only the course data through Axios.
       * This is NOT a browser/page reload.
       *
       * This allows the page to immediately display
       * the updated enrollment state.
       */
      await getCourse();
    } catch (error) {
      if (error.response?.status === 409) {
        setError(
          "You are already enrolled in this course. You can see it in My Enrollments."
        );

        // Refresh state in case the server says already enrolled.
        await getCourse();
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

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------
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

  // --------------------------------------------------
  // Course not found
  // --------------------------------------------------
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

  /*
   * Support common backend property names.
   *
   * If your backend returns:
   *   enrolled: true
   *
   * or:
   *   is_enrolled: true
   *
   * either one will work.
   */
  const isEnrolled =
    course?.enrolled === true ||
    course?.is_enrolled === true ||
    course?.isEnrolled === true;

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

          {/* Image */}
          <div className="details-image-wrapper">
            <img
              src={course.image}
              alt={course.title}
              className="details-image"
            />
          </div>

          {/* Information */}
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
                <dt>Category</dt>
                <dd>{course.category}</dd>
              </div>

              <div>
                <dt>Level</dt>
                <dd>{course.level}</dd>
              </div>

              <div>
                <dt>Duration</dt>
                <dd>{course.duration}</dd>
              </div>

              <div>
                <dt>Price</dt>
                <dd className="details-price">
                  Rs. {course.price}
                </dd>
              </div>

            </dl>

            {/* Messages */}
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

            {/* Actions */}
            <div className="details-actions">

              {/* Not logged in */}
              {!loggedIn && (
                <div className="notice">
                  <p>
                    Please login as a student to enroll
                    in this course.
                  </p>

                  <Link
                    to="/login"
                    state={{
                      from: location.pathname,
                    }}
                    className="btn btn-primary"
                  >
                    <FaSignInAlt />
                    Login to Enroll
                  </Link>
                </div>
              )}

              {/* Student already enrolled */}
              {studentLoggedIn && isEnrolled && (
                <>
                  <div className="enrolled-notice">
                    <FaGraduationCap />

                    <div>
                      <strong>
                        You are enrolled in this course.
                      </strong>

                      <span>
                        You can manage your enrollment
                        from My Enrollments.
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/my-enrollments"
                    className="btn btn-outline"
                  >
                    <FaGraduationCap />
                    My Enrollments
                  </Link>
                </>
              )}

              {/* Student not enrolled */}
              {studentLoggedIn && !isEnrolled && (
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

              {/* Admin */}
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
