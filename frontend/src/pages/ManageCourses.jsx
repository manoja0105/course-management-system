import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  FaEdit,
  FaEye,
  FaPlus,
  FaSave,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const EMPTY_COURSE = {
  title: "",
  category: "",
  level: "Beginner",
  duration: "",
  price: "",
  max_students: "",
  image: "",
  description: "",
};

const LEVEL_OPTIONS = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

async function fetchAllCourses() {
  const response = await api.get("/courses");

  return response.data.courses || [];
}

function getDurationValue(duration) {
  if (!duration) {
    return Number.POSITIVE_INFINITY;
  }

  const match = String(duration)
    .trim()
    .match(/^(\d+)\s+(Days|Weeks|Months)$/i);

  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const unitInDays = {
    days: 1,
    weeks: 7,
    months: 30,
  };

  return amount * unitInDays[unit];
}

function ManageCourses() {
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(EMPTY_COURSE);

  const [fieldErrors, setFieldErrors] = useState({});

  const [formError, setFormError] = useState("");

  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("All");

  const [levelFilter, setLevelFilter] = useState("All");

  const [sortField, setSortField] = useState("");

  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setCourses(await fetchAllCourses());
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to load courses"
        );
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  const refreshCourses = async () => {
    setCourses(await fetchAllCourses());
  };

  const categoryOptions = useMemo(() => {
    const categories = courses
      .map((course) =>
        String(course.category || "").trim()
      )
      .filter(Boolean);

    return [...new Set(categories)].sort((a, b) =>
      a.localeCompare(b, undefined, {
        sensitivity: "base",
      })
    );
  }, [courses]);

  const displayedCourses = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    const filtered = courses.filter((course) => {
      const title = String(
        course.title || ""
      ).toLowerCase();

      const category = String(
        course.category || ""
      ).toLowerCase();

      const courseId = String(
        course.id || ""
      ).toLowerCase();

      const level = String(
        course.level || ""
      );

      const matchesSearch =
        !search ||
        title.includes(search) ||
        category.includes(search) ||
        courseId.includes(search);

      const matchesCategory =
        categoryFilter === "All" ||
        String(course.category || "").trim() ===
          categoryFilter;

      const matchesLevel =
        levelFilter === "All" ||
        level === levelFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesLevel
      );
    });

    if (!sortField) {
      return filtered;
    }

    const sorted = [...filtered];

    sorted.sort((a, b) => {
      let comparison = 0;

      if (sortField === "id") {
        comparison =
          Number(a.id || 0) -
          Number(b.id || 0);
      } else if (sortField === "price") {
        comparison =
          Number(a.price || 0) -
          Number(b.price || 0);
      } else if (sortField === "max_students") {
        const aValue =
          a.max_students === null ||
          a.max_students === undefined
            ? Number.POSITIVE_INFINITY
            : Number(a.max_students);

        const bValue =
          b.max_students === null ||
          b.max_students === undefined
            ? Number.POSITIVE_INFINITY
            : Number(b.max_students);

        comparison = aValue - bValue;
      } else if (sortField === "enrolled_count") {
        comparison =
          Number(a.enrolled_count || 0) -
          Number(b.enrolled_count || 0);
      } else if (sortField === "duration") {
        comparison =
          getDurationValue(a.duration) -
          getDurationValue(b.duration);
      } else {
        const valueA = String(
          a[sortField] ?? ""
        ).trim();

        const valueB = String(
          b[sortField] ?? ""
        ).trim();

        comparison = valueA.localeCompare(
          valueB,
          undefined,
          {
            sensitivity: "base",
            numeric: true,
          }
        );
      }

      if (comparison === 0) {
        comparison =
          Number(a.id || 0) -
          Number(b.id || 0);
      }

      return sortDirection === "asc"
        ? comparison
        : -comparison;
    });

    return sorted;
  }, [
    courses,
    searchTerm,
    categoryFilter,
    levelFilter,
    sortField,
    sortDirection,
  ]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((previous) =>
        previous === "asc"
          ? "desc"
          : "asc"
      );
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIndicator = (field) => {
    if (sortField !== field) {
      return "";
    }

    return sortDirection === "asc"
      ? " ↑"
      : " ↓";
  };

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("All");
    setLevelFilter("All");
    setSortField("");
    setSortDirection("asc");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setFormError("");
  };

  const openAddForm = () => {
    setShowForm(true);
    setEditingId(null);

    setFormData({
      ...EMPTY_COURSE,
    });

    setFieldErrors({});
    setFormError("");
    setError("");
    setSuccess("");
  };

  const openEditForm = (course) => {
    setShowForm(true);
    setEditingId(course.id);

    setFormData({
      title: course.title || "",
      category: course.category || "",
      level: course.level || "Beginner",
      duration: course.duration || "",
      price: String(course.price ?? ""),
      max_students:
        course.max_students === null ||
        course.max_students === undefined
          ? ""
          : String(course.max_students),
      image: course.image || "",
      description: course.description || "",
    });

    setFieldErrors({});
    setFormError("");
    setError("");
    setSuccess("");
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);

    setFormData({
      ...EMPTY_COURSE,
    });

    setFieldErrors({});
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setFormError("");
    setFieldErrors({});
    setError("");
    setSuccess("");

    if (!formData.title.trim()) {
      setFieldErrors({
        title: "Title is required",
      });
      return;
    }

    if (!formData.category.trim()) {
      setFieldErrors({
        category: "Category is required",
      });
      return;
    }

    if (!formData.duration.trim()) {
      setFieldErrors({
        duration: "Duration is required",
      });
      return;
    }

    if (formData.price === "") {
      setFieldErrors({
        price: "Price is required",
      });
      return;
    }

    // CR-007 frontend validation
    if (
      formData.max_students !== "" &&
      !/^[1-9]\d*$/.test(
        String(formData.max_students).trim()
      )
    ) {
      setFieldErrors({
        max_students:
          "Maximum students must be a positive whole number or left blank.",
      });
      return;
    }

    const coursePayload = {
      title: formData.title.trim(),
      category: formData.category.trim(),
      level: formData.level,
      duration: formData.duration.trim(),
      price: formData.price,

      // Blank = unlimited
      max_students:
        formData.max_students === ""
          ? null
          : Number(formData.max_students),

      image: formData.image.trim(),
      description: formData.description.trim(),
    };

    setSaving(true);

    try {
      if (editingId) {
        const response = await api.put(
          `/courses/${editingId}`,
          coursePayload
        );

        setSuccess(response.data.message);
      } else {
        const response = await api.post(
          "/courses",
          coursePayload
        );

        setSuccess(response.data.message);
      }

      closeForm();

      await refreshCourses();
    } catch (error) {
      const responseData =
        error.response?.data;

      if (
        error.response?.status === 400 &&
        responseData?.errors
      ) {
        setFieldErrors(responseData.errors);

        setFormError(
          "Please correct the highlighted fields."
        );
      } else {
        setFormError(
          responseData?.message ||
            "Could not save the course. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (course) => {
    const confirmed = window.confirm(
      `Delete "${course.title}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await api.delete(
        `/courses/${course.id}`
      );

      setSuccess(response.data.message);

      await refreshCourses();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Could not delete the course."
      );
    }
  };

  return (
    <>
      <Navbar />

      <div className="container">
        <div className="page-header">
          <div>
            <h1>Manage Courses</h1>

            <p className="page-subtitle">
              Add new courses, update existing ones, or
              remove courses that are no longer offered.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={
              showForm
                ? closeForm
                : openAddForm
            }
            disabled={saving}
          >
            {showForm ? (
              <FaTimes />
            ) : (
              <FaPlus />
            )}

            {showForm
              ? "Cancel"
              : "Add Course"}
          </button>
        </div>

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

        {showForm && (
          <section className="section-card">
            <div className="section-card-header">
              <h2>
                {editingId
                  ? "Edit Course"
                  : "New Course"}
              </h2>
            </div>

            <form
              className="form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="title">
                    Title *
                  </label>

                  <input
                    id="title"
                    className={`input ${
                      fieldErrors.title
                        ? "input-error"
                        : ""
                    }`}
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Web Development"
                    disabled={saving}
                  />

                  {fieldErrors.title && (
                    <p className="field-error">
                      {fieldErrors.title}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="category">
                    Category *
                  </label>

                  <input
                    id="category"
                    className={`input ${
                      fieldErrors.category
                        ? "input-error"
                        : ""
                    }`}
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g. Programming"
                    disabled={saving}
                  />

                  {fieldErrors.category && (
                    <p className="field-error">
                      {fieldErrors.category}
                    </p>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="level">
                    Level *
                  </label>

                  <select
                    id="level"
                    className={`input ${
                      fieldErrors.level
                        ? "input-error"
                        : ""
                    }`}
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    {LEVEL_OPTIONS.map(
                      (level) => (
                        <option
                          key={level}
                          value={level}
                        >
                          {level}
                        </option>
                      )
                    )}
                  </select>

                  {fieldErrors.level && (
                    <p className="field-error">
                      {fieldErrors.level}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="duration">
                    Duration *
                  </label>

                  <input
                    id="duration"
                    className={`input ${
                      fieldErrors.duration
                        ? "input-error"
                        : ""
                    }`}
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="e.g. 8 Weeks"
                    disabled={saving}
                  />

                  {fieldErrors.duration && (
                    <p className="field-error">
                      {fieldErrors.duration}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="price">
                    Price (Rs.) *
                  </label>

                  <input
                    id="price"
                    className={`input ${
                      fieldErrors.price
                        ? "input-error"
                        : ""
                    }`}
                    type="number"
                    min="0"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="e.g. 25000"
                    disabled={saving}
                  />

                  {fieldErrors.price && (
                    <p className="field-error">
                      {fieldErrors.price}
                    </p>
                  )}
                </div>
              </div>

              {/* =====================================================
                  CR-007: Maximum Students
                  ===================================================== */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="max_students">
                    Maximum Students
                  </label>

                  <input
                    id="max_students"
                    className={`input ${
                      fieldErrors.max_students
                        ? "input-error"
                        : ""
                    }`}
                    type="number"
                    min="1"
                    step="1"
                    name="max_students"
                    value={formData.max_students}
                    onChange={handleChange}
                    placeholder="e.g. 30 (blank = Unlimited)"
                    disabled={saving}
                  />

                  <small className="form-help">
                    Leave blank for unlimited
                    enrollment.
                  </small>

                  {fieldErrors.max_students && (
                    <p className="field-error">
                      {fieldErrors.max_students}
                    </p>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="image">
                  Image URL
                </label>

                <input
                  id="image"
                  className={`input ${
                    fieldErrors.image
                      ? "input-error"
                      : ""
                  }`}
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://example.com/course.jpg"
                  disabled={saving}
                />

                {fieldErrors.image && (
                  <p className="field-error">
                    {fieldErrors.image}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="description">
                  Description
                </label>

                <textarea
                  id="description"
                  className={`input ${
                    fieldErrors.description
                      ? "input-error"
                      : ""
                  }`}
                  rows="4"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Short summary of what students will learn."
                  disabled={saving}
                />

                {fieldErrors.description && (
                  <p className="field-error">
                    {fieldErrors.description}
                  </p>
                )}
              </div>

              {formError && (
                <p className="error">
                  {formError}
                </p>
              )}

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  <FaSave />

                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Course"
                    : "Create Course"}
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeForm}
                  disabled={saving}
                >
                  <FaTimes />
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="section-card">
          <div className="section-card-header">
            <h2>Course List</h2>

            <Link
              to="/admin/enrollments"
              className="link-inline"
            >
              <FaEye />
              Manage enrollments
            </Link>
          </div>

          <div className="course-controls">
            <div className="form-group">
              <label htmlFor="course-search">
                Search Courses
              </label>

              <input
                id="course-search"
                type="text"
                className="input"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search by title, category or course ID..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="category-filter">
                Category
              </label>

              <select
                id="category-filter"
                className="input"
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All
                </option>

                {categoryOptions.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="level-filter">
                Level
              </label>

              <select
                id="level-filter"
                className="input"
                value={levelFilter}
                onChange={(event) =>
                  setLevelFilter(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All
                </option>

                {LEVEL_OPTIONS.map(
                  (level) => (
                    <option
                      key={level}
                      value={level}
                    >
                      {level}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="form-group filter-reset-group">
              <label>&nbsp;</label>

              <button
                type="button"
                className="btn btn-outline"
                onClick={resetFilters}
              >
                Reset Filters
              </button>
            </div>
          </div>

          {!loading && (
            <div className="result-counter">
              Showing{" "}
              <strong>
                {displayedCourses.length}
              </strong>{" "}
              of{" "}
              <strong>
                {courses.length}
              </strong>{" "}
              courses
            </div>
          )}

          {loading && (
            <p className="loading">
              Loading courses...
            </p>
          )}

          {!loading &&
            courses.length === 0 && (
              <p className="empty">
                No courses yet. Click "Add Course"
                to create the first one.
              </p>
            )}

          {!loading &&
            courses.length > 0 &&
            displayedCourses.length === 0 && (
              <div className="no-results">
                <p>No courses found.</p>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={resetFilters}
                >
                  Reset Filters
                </button>
              </div>
            )}

          {!loading &&
            displayedCourses.length > 0 && (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>
                        <button
                          type="button"
                          className="sort-button"
                          onClick={() =>
                            handleSort("id")
                          }
                        >
                          ID
                          {getSortIndicator("id")}
                        </button>
                      </th>

                      <th>Image</th>

                      <th>
                        <button
                          type="button"
                          className="sort-button"
                          onClick={() =>
                            handleSort("title")
                          }
                        >
                          Title
                          {getSortIndicator("title")}
                        </button>
                      </th>

                      <th>
                        <button
                          type="button"
                          className="sort-button"
                          onClick={() =>
                            handleSort("category")
                          }
                        >
                          Category
                          {getSortIndicator(
                            "category"
                          )}
                        </button>
                      </th>

                      <th>
                        <button
                          type="button"
                          className="sort-button"
                          onClick={() =>
                            handleSort("level")
                          }
                        >
                          Level
                          {getSortIndicator("level")}
                        </button>
                      </th>

                      <th>
                        <button
                          type="button"
                          className="sort-button"
                          onClick={() =>
                            handleSort("duration")
                          }
                        >
                          Duration
                          {getSortIndicator(
                            "duration"
                          )}
                        </button>
                      </th>

                      <th>
                        <button
                          type="button"
                          className="sort-button"
                          onClick={() =>
                            handleSort("price")
                          }
                        >
                          Price
                          {getSortIndicator("price")}
                        </button>
                      </th>

                      {/* CR-007 */}
                      <th>
                        <button
                          type="button"
                          className="sort-button"
                          onClick={() =>
                            handleSort(
                              "max_students"
                            )
                          }
                        >
                          Capacity
                          {getSortIndicator(
                            "max_students"
                          )}
                        </button>
                      </th>

                      {/* CR-007 */}
                      <th>Enrollment</th>

                      <th className="table-actions-column">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {displayedCourses.map(
                      (course) => (
                        <tr key={course.id}>
                          <td>{course.id}</td>

                          <td>
                            {course.image ? (
                              <img
                                src={course.image}
                                alt={course.title}
                                className="table-thumb"
                              />
                            ) : (
                              "-"
                            )}
                          </td>

                          <td>{course.title}</td>

                          <td>
                            {course.category}
                          </td>

                          <td>
                            <span className="tag tag-level">
                              {course.level}
                            </span>
                          </td>

                          <td>
                            {course.duration}
                          </td>

                          <td>
                            Rs. {course.price}
                          </td>

                          {/* CR-007 Capacity */}
                          <td>
                            {course.max_students ===
                              null ||
                            course.max_students ===
                              undefined ? (
                              <span className="tag">
                                Unlimited
                              </span>
                            ) : (
                              `${course.max_students} students`
                            )}
                          </td>

                          {/* CR-007 Enrollment */}
                          <td>
                            {course.max_students ===
                              null ||
                            course.max_students ===
                              undefined ? (
                              `${course.enrolled_count || 0} students`
                            ) : (
                              <>
                                {course.enrolled_count ||
                                  0}{" "}
                                /{" "}
                                {
                                  course.max_students
                                }

                                {course.is_full && (
                                  <span className="tag">
                                    {" "}
                                    Full
                                  </span>
                                )}
                              </>
                            )}
                          </td>

                          <td>
                            <div className="table-actions">
                              <button
                                type="button"
                                className="btn btn-small btn-outline"
                                onClick={() =>
                                  openEditForm(
                                    course
                                  )
                                }
                                disabled={saving}
                              >
                                <FaEdit />
                                Edit
                              </button>

                              <button
                                type="button"
                                className="btn btn-small btn-danger"
                                onClick={() =>
                                  handleDelete(
                                    course
                                  )
                                }
                                disabled={saving}
                              >
                                <FaTrash />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      </div>

      <Footer />
    </>
  );
}

export default ManageCourses