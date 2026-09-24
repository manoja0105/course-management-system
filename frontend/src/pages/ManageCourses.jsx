import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  FaEdit,
  FaEye,
  FaPlus,
  FaSave,
  FaTimes,
  FaTrash,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUndo,
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
  image: "",
  description: "",
};


const LEVEL_OPTIONS = [
  "Beginner",
  "Intermediate",
  "Advanced",
];


const DEFAULT_SORT = {
  field: "",
  direction: "",
};


// Load course list
async function fetchAllCourses() {
  const response = await api.get("/courses");

  return response.data.courses || [];
}


function ManageCourses() {

  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(EMPTY_COURSE);

  // Server-side field errors
  const [fieldErrors, setFieldErrors] = useState({});

  // General form error
  const [formError, setFormError] = useState("");

  // Prevent duplicate submissions
  const [saving, setSaving] = useState(false);


  // ======================================================
  // CR-003 Search / Filter / Sort State
  // ======================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);


  // ======================================================
  // Load courses
  // ======================================================

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


  // ======================================================
  // Refresh courses
  // ======================================================

  const refreshCourses = async () => {
    setCourses(await fetchAllCourses());
  };


  // ======================================================
  // CR-003 - Search / Filter / Sort
  // ======================================================

  // Get unique categories from existing courses
  const categoryOptions = [
    ...new Set(
      courses
        .map((course) => course.category)
        .filter(Boolean)
    ),
  ].sort((a, b) =>
    String(a).localeCompare(String(b), undefined, {
      sensitivity: "base",
    })
  );


  // Handle sorting
  const handleSort = (field) => {

    setSortConfig((previous) => {

      // First click on a new column
      if (previous.field !== field) {

        return {
          field,
          direction: "asc",
        };

      }

      // Same column - reverse direction
      if (previous.direction === "asc") {

        return {
          field,
          direction: "desc",
        };

      }

      // Third click - remove sorting
      return DEFAULT_SORT;

    });

  };


  // Get sorting icon
  const getSortIcon = (field) => {

    if (sortConfig.field !== field) {
      return <FaSort className="sort-icon" />;
    }

    if (sortConfig.direction === "asc") {
      return <FaSortUp className="sort-icon" />;
    }

    return <FaSortDown className="sort-icon" />;
  };


  // Convert duration into a sortable value
  const getDurationValue = (duration) => {

    if (duration === null || duration === undefined) {
      return 0;
    }

    const text = String(duration).toLowerCase().trim();

    // Find first number in duration
    const match = text.match(/[\d.]+/);

    if (!match) {
      return 0;
    }

    const number = parseFloat(match[0]);

    // Convert different units into days where possible
    if (text.includes("year")) {
      return number * 365;
    }

    if (text.includes("month")) {
      return number * 30;
    }

    if (text.includes("week")) {
      return number * 7;
    }

    if (text.includes("day")) {
      return number;
    }

    if (text.includes("hour")) {
      return number / 24;
    }

    return number;
  };


  // Filter + sort courses
  const filteredCourses = courses
    .filter((course) => {

      const search = searchTerm.trim().toLowerCase();

      if (!search) {
        return true;
      }

      const title = String(course.title || "").toLowerCase();
      const category = String(course.category || "").toLowerCase();
      const id = String(course.id || "").toLowerCase();

      return (
        title.includes(search) ||
        category.includes(search) ||
        id.includes(search)
      );

    })
    .filter((course) => {

      if (!categoryFilter) {
        return true;
      }

      return (
        String(course.category || "").toLowerCase() ===
        categoryFilter.toLowerCase()
      );

    })
    .filter((course) => {

      if (!levelFilter) {
        return true;
      }

      return (
        String(course.level || "").toLowerCase() ===
        levelFilter.toLowerCase()
      );

    })
    .sort((a, b) => {

      if (!sortConfig.field) {
        return 0;
      }

      const { field, direction } = sortConfig;

      let valueA;
      let valueB;

      // Numeric sorting
      if (field === "price") {

        valueA = parseFloat(a.price) || 0;
        valueB = parseFloat(b.price) || 0;

      }

      // Duration sorting
      else if (field === "duration") {

        valueA = getDurationValue(a.duration);
        valueB = getDurationValue(b.duration);

      }

      // Text / ID sorting
      else {

        valueA = String(a[field] ?? "").toLowerCase();
        valueB = String(b[field] ?? "");

        valueB = valueB.toLowerCase();

      }


      let comparison = 0;

      if (typeof valueA === "number" && typeof valueB === "number") {

        comparison = valueA - valueB;

      } else {

        comparison = valueA.localeCompare(
          valueB,
          undefined,
          {
            sensitivity: "base",
            numeric: field === "id",
          }
        );

      }

      return direction === "asc"
        ? comparison
        : -comparison;

    });


  // Reset search, filters and sorting
  const resetFilters = () => {

    setSearchTerm("");
    setCategoryFilter("");
    setLevelFilter("");
    setSortConfig(DEFAULT_SORT);

  };


  // ======================================================
  // Form helpers
  // ======================================================

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


  // ======================================================
  // Create / Update
  // ======================================================

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


    const coursePayload = {
      title: formData.title.trim(),
      category: formData.category.trim(),
      level: formData.level,
      duration: formData.duration.trim(),
      price: formData.price,
      image: formData.image.trim(),
      description: formData.description.trim(),
    };


    setSaving(true);


    try {

      // UPDATE
      if (editingId) {

        const response = await api.put(
          `/courses/${editingId}`,
          coursePayload
        );

        setSuccess(response.data.message);

      }

      // CREATE
      else {

        const response = await api.post(
          "/courses",
          coursePayload
        );

        setSuccess(response.data.message);

      }


      /*
        IMPORTANT FOR CR-003

        Do NOT reset:
        - searchTerm
        - categoryFilter
        - levelFilter
        - sortConfig

        Therefore the current search/filter/sort state
        remains active after create/update.
      */

      closeForm();

      await refreshCourses();

    } catch (error) {

      const responseData = error.response?.data;

      if (
        error.response?.status === 400 &&
        responseData?.errors
      ) {

        setFieldErrors(responseData.errors);

        setFormError(
          responseData.message ||
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


  // ======================================================
  // Delete
  // ======================================================

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

      /*
        Search/filter/sort states are NOT reset.
        Therefore they remain active after delete.
      */
      await refreshCourses();

    } catch (error) {

      setError(
        error.response?.data?.message ||
        "Could not delete the course."
      );

    }

  };


  // ======================================================
  // Render
  // ======================================================

  return (
    <>
      <Navbar />

      <div className="container">

        {/* ---------- Header ---------- */}

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

            {showForm ? <FaTimes /> : <FaPlus />}

            {showForm
              ? "Cancel"
              : "Add Course"}

          </button>

        </div>


        {/* ---------- Success / general errors ---------- */}

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
            ADD / EDIT FORM
        ================================================== */}

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

              {/* ---------- Title + Category ---------- */}

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


              {/* ---------- Level + Duration + Price ---------- */}

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


              {/* ---------- Image ---------- */}

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


              {/* ---------- Description ---------- */}

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


              {/* ---------- General form error ---------- */}

              {formError && (
                <p className="error">
                  {formError}
                </p>
              )}


              {/* ---------- Actions ---------- */}

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


        {/* ==================================================
            COURSE TABLE
        ================================================== */}

        <section className="section-card">

          <div className="section-card-header">

            <h2>
              All Courses
            </h2>

            <Link
              to="/admin/enrollments"
              className="link-inline"
            >
              <FaEye />
              Manage enrollments
            </Link>

          </div>


          {/* ==================================================
              CR-003 SEARCH / FILTER BAR
          ================================================== */}

          {!loading && courses.length > 0 && (

            <div className="course-filter-panel">

              <div className="course-filter-row">

                {/* Search */}

                <div className="filter-group search-group">

                  <label htmlFor="course-search">
                    Search Courses
                  </label>

                  <div className="search-input-wrapper">

                    <FaSearch className="search-icon" />

                    <input
                      id="course-search"
                      type="text"
                      className="input search-input"
                      placeholder="Search by title, category or ID..."
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(event.target.value)
                      }
                    />

                  </div>

                </div>


                {/* Category */}

                <div className="filter-group">

                  <label htmlFor="category-filter">
                    Category
                  </label>

                  <select
                    id="category-filter"
                    className="input"
                    value={categoryFilter}
                    onChange={(event) =>
                      setCategoryFilter(event.target.value)
                    }
                  >

                    <option value="">
                      All Categories
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


                {/* Level */}

                <div className="filter-group">

                  <label htmlFor="level-filter">
                    Level
                  </label>

                  <select
                    id="level-filter"
                    className="input"
                    value={levelFilter}
                    onChange={(event) =>
                      setLevelFilter(event.target.value)
                    }
                  >

                    <option value="">
                      All Levels
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


                {/* Reset */}

                <div className="filter-button-wrapper">

                  <button
                    type="button"
                    className="btn btn-outline-dark"
                    onClick={resetFilters}
                  >

                    <FaUndo />

                    Reset Filters

                  </button>

                </div>

              </div>


              {/* Result counter */}

              <div className="filter-result-row">

                <p className="result-count">
                  Showing{" "}
                  <strong>
                    {filteredCourses.length}
                  </strong>{" "}
                  of{" "}
                  <strong>
                    {courses.length}
                  </strong>{" "}
                  courses
                </p>

                {(searchTerm ||
                  categoryFilter ||
                  levelFilter ||
                  sortConfig.field) && (

                  <div className="active-filter-text">

                    Active:

                    {searchTerm && (
                      <span>
                        Search "{searchTerm}"
                      </span>
                    )}

                    {categoryFilter && (
                      <span>
                        Category: {categoryFilter}
                      </span>
                    )}

                    {levelFilter && (
                      <span>
                        Level: {levelFilter}
                      </span>
                    )}

                    {sortConfig.field && (
                      <span>
                        Sort: {sortConfig.field}{" "}
                        {sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"}
                      </span>
                    )}

                  </div>

                )}

              </div>

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


          {/* No search/filter results */}

          {!loading &&
            courses.length > 0 &&
            filteredCourses.length === 0 && (

              <div className="no-results-box">

                <p>
                  No courses found.
                </p>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={resetFilters}
                >
                  <FaUndo />
                  Reset Filters
                </button>

              </div>

            )}


          {!loading &&
            filteredCourses.length > 0 && (

              <div className="table-wrapper">

                <table className="table">

                  <thead>

                    <tr>

                      {/* ID */}

                      <th>
                        <button
                          type="button"
                          className="sort-header"
                          onClick={() =>
                            handleSort("id")
                          }
                        >
                          ID
                          {getSortIcon("id")}
                        </button>
                      </th>


                      {/* Image */}

                      <th>
                        Image
                      </th>


                      {/* Title */}

                      <th>
                        <button
                          type="button"
                          className="sort-header"
                          onClick={() =>
                            handleSort("title")
                          }
                        >
                          Title
                          {getSortIcon("title")}
                        </button>
                      </th>


                      {/* Category */}

                      <th>
                        <button
                          type="button"
                          className="sort-header"
                          onClick={() =>
                            handleSort("category")
                          }
                        >
                          Category
                          {getSortIcon("category")}
                        </button>
                      </th>


                      {/* Level */}

                      <th>
                        <button
                          type="button"
                          className="sort-header"
                          onClick={() =>
                            handleSort("level")
                          }
                        >
                          Level
                          {getSortIcon("level")}
                        </button>
                      </th>


                      {/* Duration */}

                      <th>
                        <button
                          type="button"
                          className="sort-header"
                          onClick={() =>
                            handleSort("duration")
                          }
                        >
                          Duration
                          {getSortIcon("duration")}
                        </button>
                      </th>


                      {/* Price */}

                      <th>
                        <button
                          type="button"
                          className="sort-header"
                          onClick={() =>
                            handleSort("price")
                          }
                        >
                          Price
                          {getSortIcon("price")}
                        </button>
                      </th>


                      {/* Actions */}

                      <th className="table-actions-column">
                        Actions
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {filteredCourses.map((course) => (

                      <tr key={course.id}>

                        <td>
                          {course.id}
                        </td>


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


                        <td>
                          {course.title}
                        </td>


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


                        <td>

                          <div className="table-actions">

                            <button
                              type="button"
                              className="btn btn-small btn-outline"
                              onClick={() =>
                                openEditForm(course)
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
                                handleDelete(course)
                              }
                              disabled={saving}
                            >
                              <FaTrash />
                              Delete
                            </button>

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

      <Footer />
    </>
  );
}

export default ManageCourses;