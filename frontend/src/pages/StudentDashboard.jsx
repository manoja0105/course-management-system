import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBook,
  FaEye,
  FaGraduationCap,
  FaSearch,
  FaMoneyBillWave,
} from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


/*
 * Safely convert a value into a number so NaN is never displayed.
 */
const toSafeNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};


/*
 * Format price for display.
 */
const formatPrice = (value) => {
  return toSafeNumber(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};


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


function StudentDashboard() {

  // CR-009: report calculated by the server (GET /reports/my)
  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = getUser();


  useEffect(() => {

    const loadDashboard = async () => {

      try {

        const response = await api.get("/reports/my");

        setReport(response.data.report || null);

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load your dashboard"
        );

      } finally {

        setLoading(false);

      }

    };

    loadDashboard();

  }, []);


  const recentEnrollments = report?.recentEnrollments || [];

  // "..." while loading, "-" if the report failed to load
  const show = (value) => {
    if (loading) return "...";
    if (!report) return "-";
    return toSafeNumber(value);
  };

  const showDate = (value) => {
    if (loading) return "...";
    if (!report) return "-";
    return formatDate(value);
  };


  return (

    <>
      <Navbar />

      <div className="container">

        {/* ---------- Welcome ---------- */}

        <div className="page-header">

          <div>

            <h1>
              Student Dashboard
            </h1>

            <p className="page-subtitle">
              Welcome back,{" "}
              {user?.full_name || user?.username}!
            </p>

          </div>


          <Link
            to="/courses"
            className="btn btn-primary"
          >
            <FaSearch />
            Browse Courses
          </Link>

        </div>


        {/* ---------- Error ---------- */}

        {error && (
          <p className="error">
            {error}
          </p>
        )}


        {/* ---------- Stat cards ---------- */}

        <div className="dashboard-grid">

          <div className="dashboard-card">

            <span className="dashboard-card-value">
              {show(report?.enrolledCourses)}
            </span>

            <span className="dashboard-card-label">
              My Enrolled Courses
            </span>

          </div>


          <div className="dashboard-card">

            <span className="dashboard-card-value">
              {show(report?.distinctCategories)}
            </span>

            <span className="dashboard-card-label">
              Categories Studied
            </span>

          </div>


          <div className="dashboard-card">

            <span className="dashboard-card-value dashboard-date-value">
              {showDate(report?.earliestEnrollmentDate)}
            </span>

            <span className="dashboard-card-label">
              First Enrollment
            </span>

          </div>


          <div className="dashboard-card">

            <span className="dashboard-card-value dashboard-date-value">
              {showDate(report?.latestEnrollmentDate)}
            </span>

            <span className="dashboard-card-label">
              Latest Enrollment
            </span>

          </div>


          {/* ---------- CR-004 Total Enrollment Value ---------- */}

          <div className="dashboard-card">

            <span className="dashboard-card-icon">
              <FaMoneyBillWave />
            </span>

            <span className="dashboard-card-value dashboard-price-value">
              {loading
                ? "..."
                : !report
                  ? "-"
                  : `Rs. ${formatPrice(report.totalEnrollmentValue)}`}
            </span>

            <span className="dashboard-card-label">
              Total Enrollment Value
            </span>

          </div>

        </div>


        {/* ---------- Recent enrollments ---------- */}

        <section className="section-card">

          <div className="section-card-header">

            <h2>
              My Recent Enrollments
            </h2>


            <Link
              to="/my-enrollments"
              className="link-inline"
            >
              <FaEye />
              {" "}View all
            </Link>

          </div>


          {loading && (
            <p className="loading">
              Loading...
            </p>
          )}


          {!loading &&
            report &&
            recentEnrollments.length === 0 && (

              <p className="empty">
                You have not enrolled in any courses yet.
                Head over to the courses page and enroll
                in your first course.
              </p>

            )}


          {!loading && recentEnrollments.length > 0 && (

            <div className="table-wrapper">

              <table className="table">

                <thead>

                  <tr>
                    <th>Course</th>
                    <th>Category</th>
                    <th>Level</th>
                    <th>Enrolled On</th>
                  </tr>

                </thead>


                <tbody>

                  {recentEnrollments.map((enrollment) => (

                    <tr key={enrollment.id}>

                      <td>
                        <Link
                          to={`/courses/${enrollment.courseId}`}
                        >
                          {enrollment.title}
                        </Link>
                      </td>

                      <td>{enrollment.category || "-"}</td>

                      <td>{enrollment.level || "-"}</td>

                      <td>
                        {formatDate(enrollment.enrolledAt)}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* ---------- Quick actions ---------- */}

        <section className="section-card">

          <div className="section-card-header">

            <h2>
              Quick Actions
            </h2>

          </div>


          <div className="quick-actions">

            <Link
              to="/courses"
              className="quick-action"
            >

              <span className="quick-action-icon">
                <FaBook />
              </span>

              <span>
                Browse all courses
              </span>

            </Link>


            <Link
              to="/my-enrollments"
              className="quick-action"
            >

              <span className="quick-action-icon">
                <FaGraduationCap />
              </span>

              <span>
                View my enrollments
              </span>

            </Link>

          </div>

        </section>

      </div>

      <Footer />

    </>
  );
}


export default StudentDashboard;
