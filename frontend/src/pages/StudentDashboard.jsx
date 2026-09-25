import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBook,
  FaEye,
  FaGraduationCap,
  FaSearch
} from "react-icons/fa";

import api from "../services/api";
import { getUser } from "../services/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


function StudentDashboard() {

  const [enrollments, setEnrollments] = useState([]);

  const [stats, setStats] = useState({
    courseCount: 0,
    studentCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = getUser();




  useEffect(() => {

    const loadDashboard = async () => {

      try {

        const [
          enrollmentsResponse,
          statsResponse
        ] = await Promise.all([

          api.get("/enrollments/my"),

          api.get("/courses/stats"),

        ]);


        
        setEnrollments(
          Array.isArray(
            enrollmentsResponse.data.enrollments
          )
            ? enrollmentsResponse.data.enrollments
            : []
        );


        
        setStats({

          courseCount:
            Number(statsResponse.data.courseCount) || 0,

          studentCount:
            Number(statsResponse.data.studentCount) || 0,

        });


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



  const getSafePrice = (price) => {

    const numericPrice = Number(price);

    return Number.isFinite(numericPrice)
      ? numericPrice
      : 0;

  };




  const totalEnrollmentValue = enrollments.reduce(

    (total, enrollment) => {

      return total + getSafePrice(
        enrollment.price
      );

    },

    0

  );


  

  const formatPrice = (value) => {

    const safeValue = Number.isFinite(value)
      ? value
      : 0;


    return safeValue.toLocaleString("en-LK", {

      minimumFractionDigits: 2,

      maximumFractionDigits: 2,

    });

  };



  const recentEnrollments = [...enrollments]

    .sort((a, b) => {

      const dateA = new Date(
        a.enrolled_at
      ).getTime();

      const dateB = new Date(
        b.enrolled_at
      ).getTime();


      const safeDateA =
        Number.isFinite(dateA)
          ? dateA
          : 0;


      const safeDateB =
        Number.isFinite(dateB)
          ? dateB
          : 0;


      return safeDateB - safeDateA;

    })

    .slice(0, 3);


  

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


  return (

    <>

      <Navbar />


      <div className="container">



        <div className="page-header">

          <div>

            <h1>
              Student Dashboard
            </h1>


            <p className="page-subtitle">

              Welcome back,{" "}

              {user?.full_name ||
                user?.username}!

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



        {error && (

          <p className="error">
            {error}
          </p>

        )}



        <div className="dashboard-grid">


          {/* My Enrolled Courses */}

          <div className="dashboard-card">

            <span className="dashboard-card-value">

              {loading
                ? "..."
                : enrollments.length}

            </span>


            <span className="dashboard-card-label">

              My Enrolled Courses

            </span>

          </div>


          

          <div className="dashboard-card">

            <span className="dashboard-card-value">

              {loading
                ? "..."
                : `Rs. ${formatPrice(
                    totalEnrollmentValue
                  )}`}

            </span>


            <span className="dashboard-card-label">

              Total Enrolled Value

            </span>

          </div>



          <div className="dashboard-card">

            <span className="dashboard-card-value">

              {loading
                ? "..."
                : stats.courseCount}

            </span>


            <span className="dashboard-card-label">

              Courses Available

            </span>

          </div>


        

          <div className="dashboard-card">

            <span className="dashboard-card-value">

              {loading
                ? "..."
                : stats.studentCount}

            </span>


            <span className="dashboard-card-label">

              Registered Students

            </span>

          </div>


        </div>


       

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

              View all

            </Link>

          </div>



          {loading && (

            <p className="loading">
              Loading...
            </p>

          )}



          {!loading &&
            recentEnrollments.length === 0 && (

              <p className="empty">

                You have not enrolled in any courses yet.
                Head over to the courses page and enroll
                in your first course.

              </p>

            )}


      

          {!loading &&
            recentEnrollments.length > 0 && (

              <div className="table-wrapper">


                <table className="table">


                  <thead>

                    <tr>

                      <th>
                        Course
                      </th>

                      <th>
                        Category
                      </th>

                      <th>
                        Level
                      </th>

                      <th>
                        Enrolled On
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {recentEnrollments.map(
                      (enrollment) => (

                        <tr
                          key={enrollment.id}
                        >

                          <td>

                            <Link
                              to={`/courses/${enrollment.course_id}`}
                            >

                              {enrollment.title}

                            </Link>

                          </td>


                          <td>
                            {enrollment.category}
                          </td>


                          <td>
                            {enrollment.level}
                          </td>


                          <td>

                            {formatDate(
                              enrollment.enrolled_at
                            )}

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>


                </table>

              </div>

            )}


        </section>




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

