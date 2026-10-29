import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBook,
  FaChartBar,
  FaSearch,
  FaUsers,
} from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Safe number: never shows NaN / undefined
const num = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

// Bar width in percent (0 when there is no data -> no NaN)
const percent = (value, max) =>
  max > 0 ? Math.round((num(value) / max) * 100) : 0;

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString();
};

function AdminDashboard() {
  // CR-009: report calculated by the server (GET /reports/overview)
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState("");

  // Recent enrollments are loaded independently
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsError, setEnrollmentsError] = useState("");

  const [loading, setLoading] = useState(true);

  const user = getUser();

  useEffect(() => {
    const loadDashboard = async () => {
      // allSettled: if one request fails the other still renders
      const [reportResult, enrollmentsResult] =
        await Promise.allSettled([
          api.get("/reports/overview"),
          api.get("/enrollments?limit=6"),
        ]);

      if (reportResult.status === "fulfilled") {
        setReport(reportResult.value.data.report || null);
      } else {
        setReportError(
          reportResult.reason?.response?.data?.message ||
            "Failed to load the report statistics"
        );
      }

      if (enrollmentsResult.status === "fulfilled") {
        setEnrollments(
          enrollmentsResult.value.data.enrollments || []
        );
      } else {
        setEnrollmentsError(
          enrollmentsResult.reason?.response?.data?.message ||
            "Failed to load recent enrollments"
        );
      }

      setLoading(false);
    };

    loadDashboard();
  }, []);

  const categories = report?.enrollmentsByCategory || [];
  const topCourses = report?.topCourses || [];

  const maxCategory = Math.max(
    0,
    ...categories.map((item) => num(item.enrollmentCount))
  );

  const maxTop = Math.max(
    0,
    ...topCourses.map((item) => num(item.enrollmentCount))
  );

  // Show "..." while loading, "-" if the report failed
  const show = (value) => {
    if (loading) return "...";
    if (!report) return "-";
    return num(value);
  };

  return (
    <>
      <Navbar />

      <div className="container">
        {/* Welcome */}
        <div className="page-header">
          <div>
            <h1>Admin Dashboard</h1>

            <p className="page-subtitle">
              Welcome back, {user?.full_name || user?.username}.
              {" "}Here is an overview of the system.
            </p>
          </div>

          <Link
            to="/admin/courses"
            className="btn btn-primary"
          >
            <FaChartBar />
            Manage Courses
          </Link>
        </div>

        {reportError && <p className="error">{reportError}</p>}

        {/* Statistic cards */}
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {show(report?.totalCourses)}
            </span>
            <span className="dashboard-card-label">
              Total Courses
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {show(report?.totalStudents)}
            </span>
            <span className="dashboard-card-label">
              Total Students
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {show(report?.totalEnrollments)}
            </span>
            <span className="dashboard-card-label">
              Total Enrollments
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {show(report?.studentsWithEnrollments)}
            </span>
            <span className="dashboard-card-label">
              Students With Enrollments
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {show(report?.enrollmentsLast30Days)}
            </span>
            <span className="dashboard-card-label">
              Enrollments (Last 30 Days)
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {show(report?.coursesWithoutEnrollments)}
            </span>
            <span className="dashboard-card-label">
              Courses Without Enrollments
            </span>
          </div>
        </div>

        {/* Category breakdown + Top five courses */}
        <div className="report-grid">
          <section className="section-card">
            <div className="section-card-header">
              <h2>Enrollments by Category</h2>
            </div>

            {loading && <p className="loading">Loading...</p>}

            {!loading && !report && (
              <p className="empty">
                Category report is not available right now.
              </p>
            )}

            {!loading && report && categories.length === 0 && (
              <p className="empty">No categories yet.</p>
            )}

            {!loading && categories.length > 0 && (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Courses</th>
                      <th>Enrollments</th>
                    </tr>
                  </thead>

                  <tbody>
                    {categories.map((item) => (
                      <tr key={item.category}>
                        <td>{item.category || "-"}</td>
                        <td>{num(item.courseCount)}</td>
                        <td>
                          <div className="report-bar-row">
                            <div className="report-bar-track">
                              <div
                                className="report-bar-fill"
                                style={{
                                  width: `${percent(
                                    item.enrollmentCount,
                                    maxCategory
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="report-bar-value">
                              {num(item.enrollmentCount)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="section-card">
            <div className="section-card-header">
              <h2>Top 5 Courses</h2>
            </div>

            {loading && <p className="loading">Loading...</p>}

            {!loading && !report && (
              <p className="empty">
                Top courses are not available right now.
              </p>
            )}

            {!loading && report && topCourses.length === 0 && (
              <p className="empty">
                No course has any enrollment yet.
              </p>
            )}

            {!loading && topCourses.length > 0 && (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Course</th>
                      <th>Category</th>
                      <th>Enrollments</th>
                    </tr>
                  </thead>

                  <tbody>
                    {topCourses.map((course, index) => (
                      <tr key={course.courseId}>
                        <td>{index + 1}</td>
                        <td>
                          <Link to={`/courses/${course.courseId}`}>
                            {course.title}
                          </Link>
                        </td>
                        <td>{course.category || "-"}</td>
                        <td>
                          <div className="report-bar-row">
                            <div className="report-bar-track">
                              <div
                                className="report-bar-fill"
                                style={{
                                  width: `${percent(
                                    course.enrollmentCount,
                                    maxTop
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="report-bar-value">
                              {num(course.enrollmentCount)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Recent enrollments */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>Recent Enrollments</h2>

            <Link
              to="/admin/enrollments"
              className="link-inline"
            >
              Manage enrollments
            </Link>
          </div>

          {enrollmentsError && (
            <p className="error">{enrollmentsError}</p>
          )}

          {loading && (
            <p className="loading">Loading...</p>
          )}

          {!loading &&
            !enrollmentsError &&
            enrollments.length === 0 && (
              <p className="empty">
                No enrollments have been made yet.
              </p>
            )}

          {!loading && enrollments.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Username</th>
                    <th>Course</th>
                    <th>Category</th>
                    <th>Level</th>
                    <th>Enrolled On</th>
                  </tr>
                </thead>

                <tbody>
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td>{enrollment.full_name || "-"}</td>
                      <td>{enrollment.username || "-"}</td>
                      <td>{enrollment.title || "-"}</td>
                      <td>{enrollment.category || "-"}</td>
                      <td>
                        <span className="tag tag-level">
                          {enrollment.level || "-"}
                        </span>
                      </td>
                      <td>{formatDate(enrollment.enrolled_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Admin shortcuts */}
        <section className="section-card">
          <div className="section-card-header">
            <h2>Administration</h2>
          </div>

          <div className="quick-actions">
            <Link
              to="/admin/courses"
              className="quick-action"
            >
              <span className="quick-action-icon">
                <FaBook />
              </span>
              <span>Add, edit and delete courses</span>
            </Link>

            <Link
              to="/admin/enrollments"
              className="quick-action"
            >
              <span className="quick-action-icon">
                <FaUsers />
              </span>
              <span>View and remove enrollments</span>
            </Link>

            <Link
              to="/courses"
              className="quick-action"
            >
              <span className="quick-action-icon">
                <FaSearch />
              </span>
              <span>See the public course list</span>
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}

export default AdminDashboard;
