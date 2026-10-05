import { useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  FaBars,
  FaBook,
  FaChartBar,
  FaHome,
  FaSignInAlt,
  FaSignOutAlt,
  FaTachometerAlt,
  FaTimes,
  FaUser,
  FaUserGraduate,
  FaUsers,
} from "react-icons/fa";

import {
  clearAuth,
  getUser,
  isLoggedIn,
} from "../services/auth";


function Navbar() {

  const navigate = useNavigate();
  const location = useLocation();


  // Mobile menu open / closed
  const [menuOpen, setMenuOpen] = useState(false);


  // Current authentication state
  const loggedIn = isLoggedIn();
  const user = getUser();


  // Close mobile menu
  const closeMenu = () => {
    setMenuOpen(false);
  };


  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {

    // Remove authentication data
    clearAuth();


    // Remove CR-005 session expiry state
    sessionStorage.removeItem(
      "sessionExpired"
    );

    sessionStorage.removeItem(
      "redirectAfterLogin"
    );


    closeMenu();


    // Return user to public home page
    navigate("/");

  };


  // NavLink active class
  const linkClass = ({ isActive }) =>
    isActive
      ? "nav-link active"
      : "nav-link";


  return (

    <header className="navbar">

      <div className="navbar-inner">


        {/* =================================================
            BRAND
        ================================================= */}

        <Link
          to="/"
          className="navbar-brand"
          onClick={closeMenu}
        >

          <span className="navbar-brand-mark">
            CMS
          </span>

          <span className="navbar-brand-text">
            Course Management System
          </span>

        </Link>


        {/* =================================================
            MOBILE MENU BUTTON
        ================================================= */}

        <button
          type="button"
          className="navbar-toggle"
          onClick={() =>
            setMenuOpen(!menuOpen)
          }
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >

          {menuOpen
            ? <FaTimes />
            : <FaBars />}

        </button>


        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav
          className={
            menuOpen
              ? "navbar-links open"
              : "navbar-links"
          }
        >


          {/* ---------- Home ---------- */}

          <NavLink
            to="/"
            end
            className={linkClass}
            onClick={closeMenu}
          >

            <FaHome />

            Home

          </NavLink>


          {/* ---------- Courses ---------- */}

          <NavLink
            to="/courses"
            className={linkClass}
            onClick={closeMenu}
          >

            <FaBook />

            Courses

          </NavLink>


          {/* =================================================
              STUDENT MENU
          ================================================= */}

          {loggedIn &&
            user?.role === "student" && (

              <>

                <NavLink
                  to="/student"
                  className={linkClass}
                  onClick={closeMenu}
                >

                  <FaUserGraduate />

                  Student Area

                </NavLink>


                <NavLink
                  to="/my-enrollments"
                  className={linkClass}
                  onClick={closeMenu}
                >

                  <FaBook />

                  My Enrollments

                </NavLink>

              </>

            )}


          {/* =================================================
              ADMIN MENU
          ================================================= */}

          {loggedIn &&
            user?.role === "admin" && (

              <>

                <NavLink
                  to="/admin"
                  end
                  className={linkClass}
                  onClick={closeMenu}
                >

                  <FaTachometerAlt />

                  Dashboard

                </NavLink>


                <NavLink
                  to="/admin/courses"
                  className={linkClass}
                  onClick={closeMenu}
                >

                  <FaChartBar />

                  Manage Courses

                </NavLink>


                <NavLink
                  to="/admin/enrollments"
                  className={linkClass}
                  onClick={closeMenu}
                >

                  <FaUsers />

                  Manage Enrollments

                </NavLink>

              </>

            )}


          {/* =================================================
              LOGGED-IN USER
          ================================================= */}

          {loggedIn ? (

            <div className="navbar-user">

              <span className="navbar-username">

                <FaUser />

                <span className="role-badge">
                  {user?.role}
                </span>

                {user?.full_name ||
                  user?.username}

              </span>


              <button
                type="button"
                className="btn btn-outline"
                onClick={handleLogout}
              >

                <FaSignOutAlt />

                Logout

              </button>

            </div>

          ) : (

            /* =================================================
               LOGGED-OUT USER
            ================================================= */

            <Link
              to="/login"
              state={{
                from:
                  location.pathname +
                  location.search +
                  location.hash,
              }}
              className="btn btn-primary"
              onClick={closeMenu}
            >

              <FaSignInAlt />

              Login

            </Link>

          )}

        </nav>

      </div>

    </header>

  );

}


export default Navbar;