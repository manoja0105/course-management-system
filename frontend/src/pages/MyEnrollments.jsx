import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


function MyEnrollments() {

  const [enrollments, setEnrollments] = useState([]);
  const [sortBy, setSortBy] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = getUser();


 
  useEffect(() => {

    const getEnrollments = async () => {

      try {

        const response = await api.get("/enrollments/my");

        setEnrollments(
          Array.isArray(response.data.enrollments)
            ? response.data.enrollments
            : []
        );

      } catch (error) {

        setError(
          error.response?.data?.message ||
          "Failed to load your enrollments"
        );

      } finally {

        setLoading(false);

      }

    };

    getEnrollments();

  }, []);


 

  const getSafePrice = (price) => {

    const numericPrice = Number(price);

    return Number.isFinite(numericPrice)
      ? numericPrice
      : 0;

  };




  const getSafeDate = (dateValue) => {

    if (!dateValue) {
      return 0;
    }

    const timestamp = new Date(dateValue).getTime();

    return Number.isFinite(timestamp)
      ? timestamp
      : 0;

  };


 

  const summary = useMemo(() => {

    const totalCourses = enrollments.length;


    const totalValue = enrollments.reduce(
      (total, enrollment) => {

        return total + getSafePrice(enrollment.price);

      },
      0
    );


    const averagePrice =
      totalCourses > 0
        ? totalValue / totalCourses
        : 0;


    const categories = new Set(

      enrollments
        .map((enrollment) =>
          String(enrollment.category || "")
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)

    );


    return {
      totalCourses,
      totalValue,
      averagePrice,
      categoryCount: categories.size,
    };

  }, [enrollments]);


 
  const sortedEnrollments = useMemo(() => {

 

    const sorted = [...enrollments];


    sorted.sort((a, b) => {

      switch (sortBy) {



        case "newest":

          return (
            getSafeDate(b.enrolled_at) -
            getSafeDate(a.enrolled_at)
          );



        case "oldest":

          return (
            getSafeDate(a.enrolled_at) -
            getSafeDate(b.enrolled_at)
          );


       
        case "priceHigh":

          return (
            getSafePrice(b.price) -
            getSafePrice(a.price)
          );


        
        case "priceLow":

          return (
            getSafePrice(a.price) -
            getSafePrice(b.price)
          );



        case "titleAZ":

          return String(a.title || "").localeCompare(
            String(b.title || ""),
            undefined,
            {
              sensitivity: "base",
            }
          );


        default:

          return 0;

      }

    });


    return sorted;

  }, [enrollments, sortBy]);


  

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


  const formatPrice = (price) => {

    const safePrice = getSafePrice(price);


    return safePrice.toLocaleString("en-LK", {

      minimumFractionDigits: 2,

      maximumFractionDigits: 2,

    });

  };



  return (

    <>

      <Navbar />


      <div className="container">



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


     

        {loading && (

          <p className="loading">
            Loading your enrollments...
          </p>

        )}


    
        {error && !loading && (

          <p className="error">
            {error}
          </p>

        )}



        {!loading && !error && (

          <div className="enrollment-summary">


        

            <div className="summary-card">

              <span className="summary-card-value">
                {summary.totalCourses}
              </span>

              <span className="summary-card-label">
                Total Enrolled Courses
              </span>

            </div>


           

            <div className="summary-card">

              <span className="summary-card-value">

                Rs. {formatPrice(summary.totalValue)}

              </span>

              <span className="summary-card-label">
                Total Course Value
              </span>

            </div>


      

            <div className="summary-card">

              <span className="summary-card-value">

                Rs. {formatPrice(summary.averagePrice)}

              </span>

              <span className="summary-card-label">
                Average Course Price
              </span>

            </div>


           

            <div className="summary-card">

              <span className="summary-card-value">
                {summary.categoryCount}
              </span>

              <span className="summary-card-label">
                Course Categories
              </span>

            </div>


          </div>

        )}




        {!loading &&
          !error &&
          enrollments.length === 0 && (

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


        

        {!loading &&
          !error &&
          enrollments.length > 0 && (

            <div className="enrollment-controls">

              <label htmlFor="sortEnrollments">
                Sort By:
              </label>


              <select
                id="sortEnrollments"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value)
                }
              >

                <option value="newest">
                  Newest Enrolled
                </option>


                <option value="oldest">
                  Oldest Enrolled
                </option>


                <option value="priceHigh">
                  Price: High to Low
                </option>


                <option value="priceLow">
                  Price: Low to High
                </option>


                <option value="titleAZ">
                  Course Title: A to Z
                </option>

              </select>

            </div>

        )}



        {!loading &&
          !error &&
          sortedEnrollments.length > 0 && (

            <div className="course-grid">


              {sortedEnrollments.map((enrollment) => (

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

                      {enrollment.description?.slice(0, 100)}

                      {enrollment.description?.length > 100
                        ? "..."
                        : ""}

                    </p>


             

                    <ul className="course-card-meta">


                      <li>

                        <strong>
                          Duration:
                        </strong>{" "}

                        {enrollment.duration}

                      </li>


                      <li>

                        <strong>
                          Price:
                        </strong>{" "}

                        Rs. {formatPrice(enrollment.price)}

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


                

                    <Link
                      to={`/courses/${enrollment.course_id}`}
                      className="btn btn-outline btn-block"
                    >

                      View Course

                    </Link>


                  </div>

                </article>

              ))}


            </div>

        )}


      </div>


      <Footer />

    </>

  );

}


export default MyEnrollments;


