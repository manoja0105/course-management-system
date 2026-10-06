import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  FaSearch,
  FaGraduationCap,
  FaMoneyBillWave,
  FaChartLine,
  FaLayerGroup,
  FaTimesCircle,
} from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


/*
 * Convert price safely into a number.
 */
const toSafePrice = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};


/*
 * Convert a price into a readable currency string.
 */
const formatPrice = (value) => {
  return toSafePrice(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};


function MyEnrollments() {

  const [enrollments, setEnrollments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /*
   * CR-006:
   * Stores the enrollment ID currently being cancelled.
   *
   * This allows us to disable only the relevant button.
   */
  const [cancellingId, setCancellingId] = useState(null);


  /*
   * Default sorting:
   * newest enrolled first.
   */
  const [sortOption, setSortOption] = useState("newest");


  const user = getUser();


  // ============================================================
  // Load logged-in student's enrollments
  // ============================================================

  const loadEnrollments = async () => {

    try {

      const response =
        await api.get("/enrollments/my");

      setEnrollments(
        response.data.enrollments || []
      );

      setError("");

    } catch (error) {

      setError(
        error.response?.data?.message ||
        "Failed to load your enrollments"
      );

    }
  };


  // ============================================================
  // Initial page load
  // ============================================================

  useEffect(() => {

    const getEnrollments = async () => {

      setLoading(true);

      await loadEnrollments();

      setLoading(false);

    };

    getEnrollments();

  }, []);


  // ============================================================
  // CR-006: Cancel enrollment
  // ============================================================

  const handleCancelEnrollment = async (enrollmentId) => {

    /*
     * Clear previous messages.
     */
    setError("");
    setSuccess("");


    /*
     * Ask for confirmation before cancellation.
     *
     * FR-012 / AC-014
     */
    const confirmed = window.confirm(
      "Are you sure you want to cancel this enrollment?"
    );


    if (!confirmed) {
      return;
    }


    /*
     * Disable the cancellation button while request
     * is in progress.
     *
     * FR-013 / AC-015
     */
    setCancellingId(enrollmentId);


    try {

      /*
       * Student-only endpoint.
       *
       * No student ID is sent.
       *
       * Backend identifies the student using req.user.id.
       */
      const response = await api.delete(
        `/enrollments/my/${enrollmentId}`
      );


      /*
       * Show success message.
       *
       * FR-015 / AC-017
       */
      setSuccess(
        response.data.message ||
        "Enrollment cancelled successfully."
      );


      /*
       * Refresh enrollment list.
       *
       * FR-014 / AC-016
       *
       * This is an API refresh only.
       * No full page reload is performed.
       */
      await loadEnrollments();

    } catch (error) {

      setError(
        error.response?.data?.message ||
        "Failed to cancel enrollment. Please try again."
      );

    } finally {

      /*
       * Enable the button again.
       */
      setCancellingId(null);

    }
  };


  // ============================================================
  // Format enrollment date
  // ============================================================

  const formatDate = (value) => {

    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString();
  };


  // ============================================================
  // Enrollment Summary
  // ============================================================

  const totalEnrollments =
    enrollments.length;


  const totalValue = useMemo(() => {

    return enrollments.reduce(
      (total, enrollment) => {

        return total +
          toSafePrice(enrollment.price);

      },
      0
    );

  }, [enrollments]);


  const averagePrice = useMemo(() => {

    if (enrollments.length === 0) {
      return 0;
    }

    return totalValue / enrollments.length;

  }, [enrollments.length, totalValue]);


  const distinctCategories = useMemo(() => {

    const categories = new Set();

    enrollments.forEach((enrollment) => {

      const category =
        String(enrollment.category || "")
          .trim()
          .toLowerCase();

      if (category) {
        categories.add(category);
      }

    });

    return categories.size;

  }, [enrollments]);


  // ============================================================
  // Sorting
  // ============================================================

  const sortedEnrollments = useMemo(() => {

    const sorted = [...enrollments];

    sorted.sort((a, b) => {

      switch (sortOption) {

        case "newest": {

          const aTime =
            new Date(a.enrolled_at).getTime();

          const bTime =
            new Date(b.enrolled_at).getTime();

          const aInvalid =
            Number.isNaN(aTime);

          const bInvalid =
            Number.isNaN(bTime);

          if (aInvalid && bInvalid) return 0;

          if (aInvalid) return 1;

          if (bInvalid) return -1;

          return bTime - aTime;
        }


        case "oldest": {

          const aTime =
            new Date(a.enrolled_at).getTime();

          const bTime =
            new Date(b.enrolled_at).getTime();

          const aInvalid =
            Number.isNaN(aTime);

          const bInvalid =
            Number.isNaN(bTime);

          if (aInvalid && bInvalid) return 0;

          if (aInvalid) return 1;

          if (bInvalid) return -1;

          return aTime - bTime;
        }


        case "price-high":

          return (
            toSafePrice(b.price) -
            toSafePrice(a.price)
          );


        case "price-low":

          return (
            toSafePrice(a.price) -
            toSafePrice(b.price)
          );


        case "title-az": {

          const aTitle =
            String(a.title || "");

          const bTitle =
            String(b.title || "");

          return aTitle.localeCompare(
            bTitle,
            undefined,
            {
              sensitivity: "base",
            }
          );
        }


        default:

          return 0;
      }

    });

    return sorted;

  }, [enrollments, sortOption]);


  // ============================================================
  // Render
  // ============================================================

  return (

    <>
      <Navbar />


      <div className="container">

        {/* Page Header */}

        <div className="page-header">

          <div>

            <h1>
              My Enrollments
            </h1>

            <p className="page-subtitle">

              {user?.full_name
                ? `${user.full_name}, these are the courses you are enrolled in.`
                : "These are the courses you are enrolled in."}

            </p>

          </div>


          <Link
            to="/courses"
            className="btn btn-primary"
          >
            <FaSearch />
            Browse More Courses
          </Link>

        </div>


        {/* =====================================================
            Success Message
            ===================================================== */}

        {success && !loading && (

          <div className="success enrollment-message">

            {success}

          </div>

        )}


        {/* =====================================================
            Loading
            ===================================================== */}

        {loading && (

          <p className="loading">
            Loading your enrollments...
          </p>

        )}


        {/* =====================================================
            Error
            ===================================================== */}

        {error && !loading && (

          <p className="error">
            {error}
          </p>

        )}


        {!loading && !error && (

          <>

            {/* =================================================
                Enrollment Summary
                ================================================= */}

            <section className="enrollment-summary-grid">

              <div className="enrollment-summary-card">

                <span className="enrollment-summary-icon">
                  <FaGraduationCap />
                </span>

                <span className="enrollment-summary-value">
                  {totalEnrollments}
                </span>

                <span className="enrollment-summary-label">
                  Total Enrolled Courses
                </span>

              </div>


              <div className="enrollment-summary-card">

                <span className="enrollment-summary-icon">
                  <FaMoneyBillWave />
                </span>

                <span className="enrollment-summary-value">
                  Rs. {formatPrice(totalValue)}
                </span>

                <span className="enrollment-summary-label">
                  Total Enrollment Value
                </span>

              </div>


              <div className="enrollment-summary-card">

                <span className="enrollment-summary-icon">
                  <FaChartLine />
                </span>

                <span className="enrollment-summary-value">
                  Rs. {formatPrice(averagePrice)}
                </span>

                <span className="enrollment-summary-label">
                  Average Course Price
                </span>

              </div>


              <div className="enrollment-summary-card">

                <span className="enrollment-summary-icon">
                  <FaLayerGroup />
                </span>

                <span className="enrollment-summary-value">
                  {distinctCategories}
                </span>

                <span className="enrollment-summary-label">
                  Distinct Categories
                </span>

              </div>

            </section>


            {/* =================================================
                Sorting
                ================================================= */}

            <section className="section-card enrollment-sort-card">

              <div className="enrollment-sort-row">

                <div>

                  <h2>
                    Sort Enrollments
                  </h2>

                  <p className="enrollment-sort-help">
                    Change the order of your enrolled courses.
                  </p>

                </div>


                <div className="form-group enrollment-sort-group">

                  <label htmlFor="enrollment-sort">
                    Sort by
                  </label>

                  <select
                    id="enrollment-sort"
                    className="input"
                    value={sortOption}
                    onChange={(event) =>
                      setSortOption(event.target.value)
                    }
                  >

                    <option value="newest">
                      Newest Enrolled
                    </option>

                    <option value="oldest">
                      Oldest Enrolled
                    </option>

                    <option value="price-high">
                      Price: High to Low
                    </option>

                    <option value="price-low">
                      Price: Low to High
                    </option>

                    <option value="title-az">
                      Course Title: A to Z
                    </option>

                  </select>

                </div>

              </div>

            </section>


            {/* =================================================
                Empty State
                ================================================= */}

            {enrollments.length === 0 && (

              <div className="empty-box">

                <p className="empty">
                  You have not enrolled in any courses yet.
                </p>

                <Link
                  to="/courses"
                  className="btn btn-primary"
                >
                  <FaSearch />
                  Find a Course
                </Link>

              </div>

            )}


            {/* =================================================
                Enrollment Cards
                ================================================= */}

            {enrollments.length > 0 && (

              <div className="course-grid">

                {sortedEnrollments.map(
                  (enrollment) => {

                    const isCancelling =
                      cancellingId === enrollment.id;


                    return (

                      <article
                        className="course-card"
                        key={enrollment.id}
                      >

                        <img
                          src={enrollment.image}
                          alt={enrollment.title}
                          className="course-card-image"
                          loading="lazy"
                        />


                        <div className="course-card-body">

                          <div className="course-card-tags">

                            <span className="tag tag-category">
                              {enrollment.category}
                            </span>

                            <span className="tag tag-level">
                              {enrollment.level}
                            </span>

                          </div>


                          <h3 className="course-card-title">
                            {enrollment.title}
                          </h3>


                          <p className="course-card-summary">

                            {enrollment.description?.slice(
                              0,
                              100
                            )}

                            {enrollment.description?.length > 100
                              ? "..."
                              : ""}

                          </p>


                          <ul className="course-card-meta">

                            <li>
                              <strong>
                                Duration:
                              </strong>{" "}
                              {enrollment.duration || "-"}
                            </li>


                            <li>
                              <strong>
                                Price:
                              </strong>{" "}
                              Rs.{" "}
                              {formatPrice(enrollment.price)}
                            </li>


                            <li>
                              <strong>
                                Enrolled on:
                              </strong>{" "}
                              {formatDate(
                                enrollment.enrolled_at
                              )}
                            </li>

                          </ul>


                          {/* View Course */}

                          <Link
                            to={`/courses/${enrollment.course_id}`}
                            className="btn btn-outline btn-block"
                          >
                            View Course
                          </Link>


                          {/* =================================================
                              CR-006: Cancel Enrollment
                              ================================================= */}

                          <button
                            type="button"
                            className="btn btn-danger btn-block cancel-enrollment-btn"
                            onClick={() =>
                              handleCancelEnrollment(
                                enrollment.id
                              )
                            }
                            disabled={isCancelling}
                          >

                            <FaTimesCircle />

                            {isCancelling
                              ? "Cancelling..."
                              : "Cancel Enrollment"}

                          </button>

                        </div>

                      </article>

                    );

                  }
                )}

              </div>

            )}

          </>

        )}

      </div>


      <Footer />

    </>

  );
}


export default MyEnrollments;