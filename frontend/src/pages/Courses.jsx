import { useEffect, useState } from "react";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CourseCard from "../components/CourseCard";

function Courses() {

  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------- Filter states ----------
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");


  // ---------- Load courses from the backend ----------
  useEffect(() => {

    const getCourses = async () => {

      try {

        const response = await api.get("/courses");

        // The backend always puts the array inside "courses".
        setCourses(response.data.courses || []);

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load courses"
        );

      } finally {

        setLoading(false);

      }
    };

    getCourses();

  }, []);


  // ---------- Build the category list ----------
  const categories = [
    "All",
    ...new Set(
      courses
        .map((course) => course.category)
        .filter(Boolean)
    ),
  ];


  // ---------- Level list ----------
  const levels = [
    "All",
    "Beginner",
    "Intermediate",
    "Advanced",
  ];


  // ---------- Apply all filters ----------
  const filteredCourses = courses.filter((course) => {

    const search = searchText.toLowerCase().trim();

    // Safely handle null or undefined values
    const title = String(course.title ?? "").toLowerCase();
    const category = String(course.category ?? "").toLowerCase();
    const level = String(course.level ?? "").toLowerCase();
    const description = String(
      course.description ?? ""
    ).toLowerCase();
    const duration = String(
      course.duration ?? ""
    ).toLowerCase();

    // Search in title, category, level,
    // description and duration
    const matchesSearch =
      search === "" ||
      title.includes(search) ||
      category.includes(search) ||
      level.includes(search) ||
      description.includes(search) ||
      duration.includes(search);


    // ---------- Category filter ----------
    const matchesCategory =
      selectedCategory === "All" ||
      course.category === selectedCategory;


    // ---------- Level filter ----------
    const matchesLevel =
      selectedLevel === "All" ||
      course.level === selectedLevel;


    // ---------- Price filter ----------
    const coursePrice = Number(course.price);


    const matchesMinPrice =
      minPrice === "" ||
      (
        !isNaN(coursePrice) &&
        coursePrice >= Number(minPrice)
      );


    const matchesMaxPrice =
      maxPrice === "" ||
      (
        !isNaN(coursePrice) &&
        coursePrice <= Number(maxPrice)
      );


    // All filters must match
    return (
      matchesSearch &&
      matchesCategory &&
      matchesLevel &&
      matchesMinPrice &&
      matchesMaxPrice
    );

  });


  // ---------- Clear all filters ----------
  const clearAllFilters = () => {

    setSearchText("");
    setSelectedCategory("All");
    setSelectedLevel("All");
    setMinPrice("");
    setMaxPrice("");

  };


  // ---------- Check active filters ----------
  const hasActiveFilters =
    searchText.trim() !== "" ||
    selectedCategory !== "All" ||
    selectedLevel !== "All" ||
    minPrice !== "" ||
    maxPrice !== "";


  return (

    <>
      <Navbar />

      <div className="container">

        {/* ---------- Page Header ---------- */}

        <div className="page-header">

          <div>

            <h1>Our Courses</h1>

            <p className="page-subtitle">
              Browse the full catalogue and view the
              details of any course.
            </p>

          </div>

        </div>


        {/* =========================================
            Filters
           ========================================= */}

        {!loading &&
          !error &&
          courses.length > 0 && (

            <div className="filter-bar">

              {/* ---------- Search ---------- */}

              <input
                type="text"
                className="input"
                placeholder="Search by title, category, level, description or duration..."
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
              />


              {/* ---------- Category ---------- */}

              <select
                className="input"
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(event.target.value)
                }
              >

                {categories.map((category) => (

                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>

                ))}

              </select>


              {/* ---------- Level ---------- */}

              <select
                className="input"
                value={selectedLevel}
                onChange={(event) =>
                  setSelectedLevel(event.target.value)
                }
              >

                {levels.map((level) => (

                  <option
                    key={level}
                    value={level}
                  >
                    {level}
                  </option>

                ))}

              </select>


              {/* ---------- Minimum Price ---------- */}

              <input
                type="number"
                className="input"
                placeholder="Minimum price"
                min="0"
                value={minPrice}
                onChange={(event) =>
                  setMinPrice(event.target.value)
                }
              />


              {/* ---------- Maximum Price ---------- */}

              <input
                type="number"
                className="input"
                placeholder="Maximum price"
                min="0"
                value={maxPrice}
                onChange={(event) =>
                  setMaxPrice(event.target.value)
                }
              />


              {/* ---------- Clear All ---------- */}

              <button
                type="button"
                className="clear-filters-btn"
                onClick={clearAllFilters}
                disabled={!hasActiveFilters}
              >
                Clear All Filters
              </button>

            </div>

          )}


        {/* =========================================
            Active Filter Chips
           ========================================= */}

        {!loading &&
          !error &&
          courses.length > 0 &&
          hasActiveFilters && (

            <div className="active-filters">

              <span className="filter-label">
                Active Filters:
              </span>


              {/* Search chip */}

              {searchText.trim() !== "" && (

                <span className="filter-chip">
                  Search: {searchText}
                </span>

              )}


              {/* Category chip */}

              {selectedCategory !== "All" && (

                <span className="filter-chip">
                  Category: {selectedCategory}
                </span>

              )}


              {/* Level chip */}

              {selectedLevel !== "All" && (

                <span className="filter-chip">
                  Level: {selectedLevel}
                </span>

              )}


              {/* Minimum price chip */}

              {minPrice !== "" && (

                <span className="filter-chip">
                  Min Price: {minPrice}
                </span>

              )}


              {/* Maximum price chip */}

              {maxPrice !== "" && (

                <span className="filter-chip">
                  Max Price: {maxPrice}
                </span>

              )}

            </div>

          )}


        {/* =========================================
            Loading state
           ========================================= */}

        {loading && (

          <p className="loading">
            Loading courses...
          </p>

        )}


        {/* =========================================
            Error state
           ========================================= */}

        {error && !loading && (

          <p className="error">
            {error}
          </p>

        )}


        {/* =========================================
            No courses exist
           ========================================= */}

        {!loading &&
          !error &&
          courses.length === 0 && (

            <p className="empty">
              There are no courses available at
              the moment.
            </p>

          )}


        {/* =========================================
            Courses exist but no filter match
           ========================================= */}

        {!loading &&
          !error &&
          courses.length > 0 &&
          filteredCourses.length === 0 && (

            <p className="empty">
              No courses match the selected filters.
              Try changing or clearing your filters.
            </p>

          )}


        {/* =========================================
            Result count and Course list
           ========================================= */}

        {!loading &&
          !error &&
          courses.length > 0 &&
          filteredCourses.length > 0 && (

            <>

              <p className="result-count">
                Showing {filteredCourses.length} of{" "}
                {courses.length} courses
              </p>


              <div className="course-grid">

                {filteredCourses.map((course) => (

                  <CourseCard
                    key={course.id}
                    course={course}
                  />

                ))}

              </div>

            </>

          )}

      </div>

      <Footer />

    </>

  );
}

export default Courses;

