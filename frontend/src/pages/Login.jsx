import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  FaSearch,
  FaSignInAlt,
} from "react-icons/fa";

import api from "../services/api";
import { saveAuth } from "../services/auth";
import Navbar from "../components/Navbar";


function Login() {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  const navigate = useNavigate();
  const location = useLocation();


  // =====================================================
  // SESSION EXPIRY INFORMATION
  // =====================================================

  const sessionExpired =
    sessionStorage.getItem("sessionExpired") === "true";


  const storedRedirect =
    sessionStorage.getItem("redirectAfterLogin");


  const stateRedirect =
    location.state?.from;


  const redirectTo =
    storedRedirect ||
    stateRedirect ||
    null;


  // =====================================================
  // SHOW SESSION EXPIRED MESSAGE
  // =====================================================

  useEffect(() => {

    if (sessionExpired) {

      setError(
        "Your session has expired. Please log in again."
      );

    }

  }, [sessionExpired]);


  // =====================================================
  // LOGIN
  // =====================================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");


    // ---------- Basic validation ----------

    if (!username.trim() || !password) {

      setError(
        "Please enter both username and password."
      );

      return;
    }


    setLoading(true);


    try {

      // ---------- Login request ----------

      const response = await api.post(
        "/auth/login",
        {
          username,
          password,
        }
      );


      // ---------- Save new JWT + user ----------

      saveAuth(
        response.data.token,
        response.data.user
      );


      // ---------- Get role ----------

      const role =
        response.data.user.role;


      // =================================================
      // RETURN TO ORIGINAL PAGE AFTER SESSION EXPIRY
      // =================================================

      if (
        redirectTo &&
        !redirectTo.startsWith("/login")
      ) {

        sessionStorage.removeItem(
          "redirectAfterLogin"
        );

        sessionStorage.removeItem(
          "sessionExpired"
        );


        navigate(
          redirectTo,
          { replace: true }
        );

        return;
      }


      // ---------- Normal login ----------

      sessionStorage.removeItem(
        "redirectAfterLogin"
      );

      sessionStorage.removeItem(
        "sessionExpired"
      );


      if (role === "admin") {

        navigate("/admin");

      } else {

        navigate("/student");

      }

    } catch (error) {

      // =================================================
      // NORMAL LOGIN FAILURE
      // =================================================

      if (error.response) {

        setError(
          error.response.data?.message ||
          `Login failed (status ${error.response.status})`
        );

      } else {

        setError(
          "Cannot reach the server. Please check that the backend is running on http://localhost:3000"
        );

      }

    } finally {

      setLoading(false);

    }

  };


  return (

    <>

      <Navbar />


      <div className="login-container">

        <h1>Login</h1>


        <p className="login-subtitle">
          Sign in to enroll in courses.
        </p>


        <form onSubmit={handleSubmit}>


          {/* ---------- Username ---------- */}

          <div className="form-group">

            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Enter username"
              autoComplete="username"
              disabled={loading}
            />

          </div>


          {/* ---------- Password ---------- */}

          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter password"
              autoComplete="current-password"
              disabled={loading}
            />

          </div>


          {/* ---------- Error / expiry message ---------- */}

          {error && (
            <p className="error">
              {error}
            </p>
          )}


          {/* ---------- Login button ---------- */}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >

            <FaSignInAlt />

            {loading
              ? "Logging in..."
              : "Login"}

          </button>

        </form>


        <p className="login-footer">

          Not sure where to go?{" "}

          <Link to="/courses">

            <FaSearch />

            Browse the courses

          </Link>{" "}

          first.

        </p>

      </div>

    </>

  );
}


export default Login;