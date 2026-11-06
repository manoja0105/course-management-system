
import { Fragment, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaCheck, FaTimes, FaTrash } from "react-icons/fa";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// CR-011: status tabs (default view = requests waiting for approval)
const STATUS_TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" }
];

const STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected"
};

const MAX_REASON_LENGTH = 500;

const INITIAL_FILTERS = {
  q: "",
  courseId: "",
  status: "pending",
  from: "",
  to: "",
  sort: "date",
  order: "desc",
  limit: "20"
};

function ManageEnrollments() {
  const [courses, setCourses] = useState([]);
  // /admin/enrollments?status=pending opens the matching tab
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState(() => {
    const statusParam = searchParams.get("status");

    return STATUS_TABS.some((tab) => tab.value === statusParam)
      ? { ...INITIAL_FILTERS, status: statusParam }
      : INITIAL_FILTERS;
  });
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  const [enrollments, setEnrollments] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // CR-011: approve / reject
  const [processingId, setProcessingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState("");

  // Load courses for the dropdown.
  useEffect(() => {
    let active = true;

    const loadCourses = async () => {
      try {
        const response = await api.get("/courses");

        if (active) {
          setCourses(response.data.courses || []);
        }
      } catch (err) {
        console.error("Could not load courses:", err.message);
      }
    };

    loadCourses();

    return () => {
      active = false;
    };
  }, []);

  // Debounce student search.
  useEffect(() => {
    const timer = setTimeout(() => {
      const value = searchInput.trim();

      setFilters((previous) =>
        previous.q === value
          ? previous
          : { ...previous, q: value }
      );

      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const updateFilter = (name, value) => {
    setSuccess("");
    setActionError("");
    setRejectingId(null);
    setRejectReason("");
    setFilters((previous) => ({
      ...previous,
      [name]: value
    }));
    setPage(1);
  };

  // Retrieve only the requested page from the backend.
  const loadEnrollments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = { ...filters, page };

      Object.keys(params).forEach((key) => {
        if (params[key] === "") {
          delete params[key];
        }
      });

      // "all" = no status filter
      if (params.status === "all") {
        delete params.status;
      }

      params.limit = Number(filters.limit);

      const response = await api.get("/enrollments", { params });
      const records = response.data.enrollments || [];
      const meta = response.data.pagination;

      if (!meta) {
        throw new Error("Pagination metadata is missing.");
      }

      // Correct the page if deletion emptied it.
      if (page > 1 && records.length === 0) {
        if (meta.total === 0) {
          setPage(1);
        } else {
          const lastValidPage = Math.ceil(
            meta.total / Number(filters.limit)
          );

          setPage(Math.min(page - 1, lastValidPage));
        }

        return;
      }

      setEnrollments(records);
      setPagination(meta);
    } catch (err) {
      setEnrollments([]);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to load enrollments."
      );
    } finally {
      setLoading(false);
    }
  }, [filters, page, reloadKey]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  // CR-011: approve or reject a pending request
  const reviewRequest = async (enrollment, status, reason = "") => {
    setError("");
    setSuccess("");
    setActionError("");
    setProcessingId(enrollment.id);

    try {
      const response = await api.patch(
        `/enrollments/${enrollment.id}/status`,
        { status, reason }
      );

      setSuccess(response.data.message);
      setRejectingId(null);
      setRejectReason("");
      setReloadKey((previous) => previous + 1);
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
        "Could not update the request."
      );

      // The list may be out of date (already processed / course full)
      if (err.response?.status === 409) {
        setRejectingId(null);
        setRejectReason("");
        setReloadKey((previous) => previous + 1);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = (enrollment) => {
    const student =
      enrollment.full_name || enrollment.username || "this student";

    const confirmed = window.confirm(
      `Approve ${student}'s request for "${enrollment.title}"?`
    );

    if (!confirmed) return;

    reviewRequest(enrollment, "approved");
  };

  const openReject = (enrollment) => {
    setActionError("");
    setSuccess("");
    setRejectingId(enrollment.id);
    setRejectReason("");
  };

  const closeReject = () => {
    setRejectingId(null);
    setRejectReason("");
  };

  const submitReject = (enrollment) => {
    const reason = rejectReason.trim();

    if (reason === "") {
      setActionError("Please enter a rejection reason.");
      return;
    }

    reviewRequest(enrollment, "rejected", reason);
  };

  const handleDelete = async (enrollment) => {
    const student =
      enrollment.full_name || enrollment.username || "this student";

    const confirmed = window.confirm(
      `Remove ${student} from "${enrollment.title}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await api.delete(
        `/enrollments/${enrollment.id}`
      );

      setSuccess(response.data.message);
      setReloadKey((previous) => previous + 1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not delete the enrollment."
      );
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "-"
      : date.toLocaleDateString();
  };

  const total = pagination.total;
  const totalPages = pagination.totalPages;

  const start =
    total === 0 ? 0 : (page - 1) * pagination.limit + 1;

  const end = Math.min(page * pagination.limit, total);

  return (
    <>
      <Navbar />

      <main className="container">
        <div className="page-header">
          <div>
            <h1>Manage Enrollments</h1>
            <p className="page-subtitle">
              Review enrollment requests, then search, filter, sort and
              manage student enrollments.
            </p>
          </div>
        </div>

        {/* CR-011: status tabs */}
        <div className="status-tabs" role="group" aria-label="Status">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`status-tab${
                filters.status === tab.value ? " active" : ""
              }`}
              onClick={() => updateFilter("status", tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section className="section-card cr008-filters">
          <div className="cr008-filter-grid">
            <div className="form-group">
              <label htmlFor="enrollmentSearch">
                Search student
              </label>
              <input
                id="enrollmentSearch"
                className="input"
                type="search"
                placeholder="Name or username"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="courseFilter">Course</label>
              <select
                id="courseFilter"
                className="input"
                value={filters.courseId}
                onChange={(event) =>
                  updateFilter("courseId", event.target.value)
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

            <div className="form-group">
              <label htmlFor="enrollmentFrom">From date</label>
              <input
                id="enrollmentFrom"
                className="input"
                type="date"
                value={filters.from}
                max={filters.to || undefined}
                onChange={(event) =>
                  updateFilter("from", event.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="enrollmentTo">To date</label>
              <input
                id="enrollmentTo"
                className="input"
                type="date"
                value={filters.to}
                min={filters.from || undefined}
                onChange={(event) =>
                  updateFilter("to", event.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="enrollmentSort">Sort by</label>
              <select
                id="enrollmentSort"
                className="input"
                value={filters.sort}
                onChange={(event) =>
                  updateFilter("sort", event.target.value)
                }
              >
                <option value="date">Enrollment date</option>
                <option value="student">Student name</option>
                <option value="course">Course name</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="enrollmentOrder">Sort order</label>
              <select
                id="enrollmentOrder"
                className="input"
                value={filters.order}
                onChange={(event) =>
                  updateFilter("order", event.target.value)
                }
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="enrollmentLimit">Records per page</label>
              <select
                id="enrollmentLimit"
                className="input"
                value={filters.limit}
                onChange={(event) =>
                  updateFilter("limit", event.target.value)
                }
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>

            <div className="form-group">
              <label>Reset filters</label>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSearchInput("");
                  setFilters(INITIAL_FILTERS);
                  setPage(1);
                  setSuccess("");
                }}
              >
                Clear filters
              </button>
            </div>
          </div>
        </section>

        {success && <p className="success">{success}</p>}
        {error && <p className="error">{error}</p>}
        {actionError && <p className="error">{actionError}</p>}

        <section className="section-card">
          <div className="section-card-header">
            <h2>Enrollment Requests</h2>
            <p className="cr008-total">
              Total matching records: {total}
            </p>
          </div>

          {loading && (
            <p className="loading">Loading enrollments...</p>
          )}

          {!loading && !error && enrollments.length === 0 && (
            <p className="empty">
              No enrollments match your search or filters.
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
                    <th>Requested On</th>
                    <th>Status</th>
                    <th>Decision</th>
                    <th className="table-actions-column">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {enrollments.map((enrollment) => {
                    const isPending = enrollment.status === "pending";
                    const isProcessing = processingId === enrollment.id;

                    return (
                      <Fragment key={enrollment.id}>
                        <tr>
                          <td>{enrollment.full_name}</td>
                          <td>{enrollment.username}</td>
                          <td>{enrollment.title}</td>
                          <td>{enrollment.category}</td>
                          <td>
                            <span className="tag tag-level">
                              {enrollment.level}
                            </span>
                          </td>
                          <td>{formatDate(enrollment.enrolled_at)}</td>
                          <td>
                            <span
                              className={`status-badge status-${enrollment.status}`}
                            >
                              {STATUS_LABELS[enrollment.status] ||
                                enrollment.status}
                            </span>
                          </td>
                          <td>
                            {isPending ? (
                              "-"
                            ) : (
                              <>
                                {enrollment.reviewed_by_name || "-"}

                                <span className="decision-meta">
                                  {formatDate(enrollment.reviewed_at)}
                                </span>

                                {enrollment.decision_note && (
                                  <span className="decision-meta">
                                    {enrollment.decision_note}
                                  </span>
                                )}
                              </>
                            )}
                          </td>
                          <td>
                            <div className="review-actions">
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-small btn-success"
                                    disabled={isProcessing}
                                    onClick={() =>
                                      handleApprove(enrollment)
                                    }
                                  >
                                    <FaCheck /> Approve
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-small btn-outline"
                                    disabled={isProcessing}
                                    onClick={() =>
                                      openReject(enrollment)
                                    }
                                  >
                                    <FaTimes /> Reject
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                className="btn btn-small btn-danger"
                                disabled={isProcessing}
                                onClick={() => handleDelete(enrollment)}
                              >
                                <FaTrash /> Remove
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* CR-011: rejection reason form */}
                        {isPending && rejectingId === enrollment.id && (
                          <tr className="reject-row">
                            <td colSpan={9}>
                              <div className="reject-form">
                                <label
                                  htmlFor={`reject-reason-${enrollment.id}`}
                                >
                                  Rejection reason (required)
                                </label>

                                <textarea
                                  id={`reject-reason-${enrollment.id}`}
                                  className="input"
                                  rows={3}
                                  maxLength={MAX_REASON_LENGTH}
                                  placeholder="e.g. Required prerequisite is missing"
                                  value={rejectReason}
                                  onChange={(event) =>
                                    setRejectReason(event.target.value)
                                  }
                                />

                                <span className="reject-char-count">
                                  {rejectReason.length} /{" "}
                                  {MAX_REASON_LENGTH}
                                </span>

                                <div className="reject-form-actions">
                                  <button
                                    type="button"
                                    className="btn btn-small btn-danger"
                                    disabled={
                                      isProcessing ||
                                      rejectReason.trim() === ""
                                    }
                                    onClick={() =>
                                      submitReject(enrollment)
                                    }
                                  >
                                    <FaTimes />{" "}
                                    {isProcessing
                                      ? "Rejecting..."
                                      : "Confirm rejection"}
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-small btn-secondary"
                                    disabled={isProcessing}
                                    onClick={closeReject}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="cr008-pagination">
            <p className="cr008-range" aria-live="polite">
              Showing {start}–{end} of {total}
            </p>

            <p className="cr008-page-info">
              Page {page} of {totalPages}
            </p>

            <div className="cr008-pagination-buttons">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading || page <= 1 || totalPages === 0}
                onClick={() => setPage(1)}
              >
                First
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading || page <= 1 || totalPages === 0}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={
                  loading ||
                  totalPages === 0 ||
                  page >= totalPages
                }
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={
                  loading ||
                  totalPages === 0 ||
                  page >= totalPages
                }
                onClick={() => setPage(totalPages)}
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

export default ManageEnrollments;
