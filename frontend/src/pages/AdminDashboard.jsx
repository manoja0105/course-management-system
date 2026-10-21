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

function AdminDashboard() {
  const [stats, setStats] = useState({
    courseCount: 0,
    studentCount: 0,
  });

  const [enrollments, setEnrollments] = useState([]);
  const [totalEnrollments, setTotalEnrollments] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = getUser();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsResponse, enrollmentsResponse] =
          await Promise.all([
            api.get("/courses/stats"),
            api.get("/enrollments?limit=20"),
          ]);

        setStats({
          courseCount: statsResponse.data.courseCount,
          studentCount: statsResponse.data.studentCount,
        });

        setEnrollments(
          enrollmentsResponse.data.enrollments || []
        );

        setTotalEnrollments(
          enrollmentsResponse.data.pagination?.total ??
            enrollmentsResponse.data.enrollments?.length ??
            0
        );
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to load the dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // Count distinct students in the records currently loaded.
  const uniqueStudents = new Set(
    enrollments.map((enrollment) => enrollment.student_id)
  ).size;

  // Backend sorts the list by enrollment date descending.
  const recentEnrollments = enrollments.slice(0, 6);

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "-"
      : date.toLocaleDateString();
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

        {error && <p className="error">{error}</p>}

        {/* Statistic cards */}
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : stats.courseCount}
            </span>
            <span className="dashboard-card-label">
              Total Courses
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : stats.studentCount}
            </span>
            <span className="dashboard-card-label">
              Total Students
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : totalEnrollments}
            </span>
            <span className="dashboard-card-label">
              Total Enrollments
            </span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card-value">
              {loading ? "..." : uniqueStudents}
            </span>
            <span className="dashboard-card-label">
              Students in Loaded Enrollments
            </span>
          </div>
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

          {loading && (
            <p className="loading">Loading...</p>
          )}

          {!loading && recentEnrollments.length === 0 && (
            <p className="empty">
              No enrollments have been made yet.
            </p>
          )}

          {!loading && recentEnrollments.length > 0 && (
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
                  {recentEnrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td>
                        {enrollment.full_name || "-"}
                      </td>

                      <td>
                        {enrollment.username || "-"}
                      </td>

                      <td>
                        {enrollment.title || "-"}
                      </td>

                      <td>
                        {enrollment.category || "-"}
                      </td>

                      <td>
                        <span className="tag tag-level">
                          {enrollment.level || "-"}
                        </span>
                      </td>

                      <td>
                        {formatDate(enrollment.enrolled_at)}
                      </td>
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