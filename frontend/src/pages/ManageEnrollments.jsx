// frontend/src/pages/ManageEnrollments.jsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { FaSearch, FaSyncAlt, FaTrash } from "react-icons/fa";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("date");
  const [order, setOrder] = useState("desc");
  const [limit, setLimit] = useState("20");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Load courses for the course filter.
  useEffect(() => {
    let active = true;

    const loadCourses = async () => {
      try {
        const response = await api.get("/courses");
        const data = response.data;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.courses)
            ? data.courses
            : [];

        if (active) {
          setCourses(list);
        }
      } catch {
        if (active) {
          setCourses([]);
        }
      }
    };

    loadCourses();

    return () => {
      active = false;
    };
  }, []);

  // Fetch only the requested page from the backend.
  const loadEnrollments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit,
        sort,
        order,
      });

      if (search.trim()) {
        params.set("q", search.trim());
      }

      if (courseId) {
        params.set("courseId", courseId);
      }

      if (from) {
        params.set("from", from);
      }

      if (to) {
        params.set("to", to);
      }

      const response = await api.get(
        `/enrollments?${params.toString()}`
      );

      const data = response.data || {};

      setEnrollments(
        Array.isArray(data.enrollments)
          ? data.enrollments
          : []
      );

      setPagination(
        data.pagination || {
          page,
          limit: Number(limit),
          total: 0,
          totalPages: 0,
        }
      );
    } catch (requestError) {
      setEnrollments([]);

      setPagination({
        page,
        limit: Number(limit),
        total: 0,
        totalPages: 0,
      });

      setError(
        requestError.response?.data?.message ||
          "Failed to load enrollments. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, order, search, courseId, from, to]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  // Reset to page 1 when a filter or sorting option changes.
  const changeFilter = (setter, value) => {
    setter(value);
    setPage(1);
    setNotice("");
  };

  const firstRecord =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) * pagination.limit + 1;

  const lastRecord = Math.min(
    pagination.page * pagination.limit,
    pagination.total
  );

  const pageNumbers = useMemo(
    () => ({
      canGoBack: pagination.page > 1,
      canGoForward:
        pagination.totalPages > 0 &&
        pagination.page < pagination.totalPages,
    }),
    [pagination.page, pagination.totalPages]
  );

  // Delete an enrollment and refresh the results.
  const handleDelete = async (enrollment) => {
    const studentName =
      enrollment.full_name ||
      enrollment.username ||
      "this student";

    const courseName =
      enrollment.course_title || "this course";

    if (
      !window.confirm(
        `Delete ${studentName}'s enrollment in "${courseName}"?`
      )
    ) {
      return;
    }

    setDeletingId(enrollment.id);
    setError("");
    setNotice("");

    try {
      await api.delete(`/enrollments/${enrollment.id}`);

      // Move back one page if deleting the only row on this page.
      if (enrollments.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        await loadEnrollments();
      }

      setNotice("Enrollment deleted successfully.");
    } catch (deleteError) {
      setError(
        deleteError.response?.data?.message ||
          "Failed to delete the enrollment. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "-"
      : date.toLocaleDateString("en-GB");
  };

  return (
    <>
      <Navbar />

      <main className="container admin-enrollments-page">
        <div className="page-header">
          <div>
            <h1>Manage Enrollments</h1>
            <p className="page-subtitle">
              Search, filter, sort, and manage student course enrollments.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline"
            onClick={loadEnrollments}
            disabled={loading}
          >
            <FaSyncAlt /> Refresh
          </button>
        </div>

        <section
          className="admin-enrollment-filters"
          aria-label="Enrollment filters"
        >
          <div className="admin-enrollment-search">
            <label htmlFor="enrollmentSearch">
              Search student
            </label>

            <div className="admin-enrollment-search-input">
              <FaSearch aria-hidden="true" />

              <input
                id="enrollmentSearch"
                type="search"
                className="input"
                value={search}
                placeholder="Student name or username"
                onChange={(event) =>
                  changeFilter(setSearch, event.target.value)
                }
              />
            </div>
          </div>

          <div className="admin-enrollment-filter-field">
            <label htmlFor="enrollmentCourse">Course</label>

            <select
              id="enrollmentCourse"
              className="input"
              value={courseId}
              onChange={(event) =>
                changeFilter(setCourseId, event.target.value)
              }
            >
              <option value="">All courses</option>

              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-enrollment-filter-field">
            <label htmlFor="enrollmentFrom">Enrolled from</label>

            <input
              id="enrollmentFrom"
              type="date"
              className="input"
              value={from}
              max={to || undefined}
              onChange={(event) =>
                changeFilter(setFrom, event.target.value)
              }
            />
          </div>

          <div className="admin-enrollment-filter-field">
            <label htmlFor="enrollmentTo">Enrolled to</label>

            <input
              id="enrollmentTo"
              type="date"
              className="input"
              value={to}
              min={from || undefined}
              onChange={(event) =>
                changeFilter(setTo, event.target.value)
              }
            />
          </div>

          <div className="admin-enrollment-filter-field">
            <label htmlFor="enrollmentSort">Sort by</label>

            <select
              id="enrollmentSort"
              className="input"
              value={sort}
              onChange={(event) =>
                changeFilter(setSort, event.target.value)
              }
            >
              <option value="date">Enrollment date</option>
              <option value="student">Student name</option>
              <option value="course">Course name</option>
            </select>
          </div>

          <div className="admin-enrollment-filter-field">
            <label htmlFor="enrollmentOrder">Order</label>

            <select
              id="enrollmentOrder"
              className="input"
              value={order}
              onChange={(event) =>
                changeFilter(setOrder, event.target.value)
              }
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <div className="admin-enrollment-filter-field">
            <label htmlFor="enrollmentLimit">Rows per page</label>

            <select
              id="enrollmentLimit"
              className="input"
              value={limit}
              onChange={(event) =>
                changeFilter(setLimit, event.target.value)
              }
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </section>

        {error && (
          <div
            className="admin-enrollment-alert error"
            role="alert"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            className="admin-enrollment-alert success"
            role="status"
          >
            {notice}
          </div>
        )}

        <section className="section-card admin-enrollment-results">
          <div className="admin-enrollment-results-header">
            <div>
              <h2>Enrollment records</h2>
              <p>
                Showing {firstRecord}–{lastRecord} of{" "}
                {pagination.total}
              </p>
            </div>

            <span className="admin-enrollment-total">
              {pagination.total} total
            </span>
          </div>

          {loading ? (
            <p className="loading" role="status">
              Loading enrollments...
            </p>
          ) : enrollments.length === 0 ? (
            <div className="admin-enrollment-empty">
              <h3>No enrollments found</h3>
              <p>Try changing the search text or filters.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table admin-enrollment-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Username</th>
                    <th>Course</th>
                    <th>Category</th>
                    <th>Level</th>
                    <th>Enrolled on</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td>{enrollment.full_name || "-"}</td>
                      <td>{enrollment.username || "-"}</td>
                      <td>{enrollment.course_title || "-"}</td>
                      <td>{enrollment.course_category || "-"}</td>
                      <td>{enrollment.course_level || "-"}</td>
                      <td>{formatDate(enrollment.enrolled_at)}</td>

                      <td>
                        <button
                          type="button"
                          className="btn btn-danger admin-enrollment-delete"
                          onClick={() => handleDelete(enrollment)}
                          disabled={deletingId === enrollment.id}
                          aria-label={`Delete enrollment for ${
                            enrollment.full_name ||
                            enrollment.username ||
                            "student"
                          }`}
                        >
                          <FaTrash />

                          {deletingId === enrollment.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="admin-enrollment-pagination">
            <div className="admin-enrollment-page-info">
              Page {pagination.totalPages === 0 ? 0 : pagination.page} of{" "}
              {pagination.totalPages}
            </div>

            <div className="admin-enrollment-page-buttons">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setPage(1)}
                disabled={loading || !pageNumbers.canGoBack}
              >
                First
              </button>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() =>
                  setPage((current) => Math.max(1, current - 1))
                }
                disabled={loading || !pageNumbers.canGoBack}
              >
                Previous
              </button>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setPage((current) => current + 1)}
                disabled={loading || !pageNumbers.canGoForward}
              >
                Next
              </button>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setPage(pagination.totalPages)}
                disabled={loading || !pageNumbers.canGoForward}
              >
                Last
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default AdminEnrollments;