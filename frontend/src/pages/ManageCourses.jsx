
import { useEffect, useState } from "react";
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
  image: "",
  description: "",
};


const LEVEL_OPTIONS = [
  "Beginner",
  "Intermediate",
  "Advanced",
];


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
  // Form helpers
  // ======================================================

  const handleChange = (event) => {

    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Remove the field error as the user edits the field
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

    // Prevent duplicate submissions
    if (saving) {
      return;
    }

    setFormError("");
    setFieldErrors({});
    setError("");
    setSuccess("");

    /*
      The backend is authoritative.

      We only do a small amount of client-side checking here
      for immediate feedback. The server performs ALL required
      validation before saving.
    */

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


    // Prepare data for backend
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

      // ==================================================
      // UPDATE
      // ==================================================

      if (editingId) {

        const response = await api.put(
          `/courses/${editingId}`,
          coursePayload
        );

        setSuccess(response.data.message);

      }

      // ==================================================
      // CREATE
      // ==================================================

      else {

        const response = await api.post(
          "/courses",
          coursePayload
        );

        setSuccess(response.data.message);
      }


      // Close form only after successful save
      closeForm();

      // Reload courses
      await refreshCourses();

    } catch (error) {

      const responseData = error.response?.data;

      /*
        Server validation response:

        {
          message: "Validation failed",
          errors: {
            title: "...",
            price: "..."
          }
        }
      */

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
              {courses.length > 0
                ? ` (${courses.length})`
                : ""}
            </h2>

            <Link
              to="/admin/enrollments"
              className="link-inline"
            >
              <FaEye />
              Manage enrollments
            </Link>

          </div>


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
            courses.length > 0 && (

              <div className="table-wrapper">

                <table className="table">

                  <thead>

                    <tr>
                      <th>ID</th>
                      <th>Image</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Level</th>
                      <th>Duration</th>
                      <th>Price</th>
                      <th className="table-actions-column">
                        Actions
                      </th>
                    </tr>

                  </thead>


                  <tbody>

                    {courses.map((course) => (

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

