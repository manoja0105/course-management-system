import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaSearch, FaSignInAlt } from "react-icons/fa";

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


  const savedRedirect = localStorage.getItem("redirectAfterLogin");

  
  const redirectFromState = location.state?.from;

  
  const redirectTo = savedRedirect || redirectFromState;


  const sessionExpired =
    localStorage.getItem("sessionExpired") === "true";


  const handleSubmit = async (event) => {

    // Stop the browser from reloading the whole page
    event.preventDefault();

    setError("");


    // Simple client-side validation
    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }


    setLoading(true);


    try {

      const response = await api.post("/auth/login", {
        username,
        password,
      });


      saveAuth(
        response.data.token,
        response.data.user
      );


      localStorage.removeItem("sessionExpired");

      if (
        redirectTo &&
        !redirectTo.startsWith("/login")
      ) {

        // Remove the saved redirect after using it
        localStorage.removeItem("redirectAfterLogin");

        navigate(redirectTo);

        return;
      }


      const role = response.data.user.role;


      if (role === "admin") {

        navigate("/admin");

      } else {

        navigate("/student");

      }

    } catch (error) {

      if (error.response) {

        if (error.response.status === 401) {

          setError("Invalid username or password");

        } else {

          setError(
            error.response.data?.message ||
            `Login failed (status ${error.response.status})`
          );
        }

      } else {

        setError(
          "Cannot reach the server. Please check that the backend is running on http://localhost:3000"
        );

      }

    } finally {

      // Always stop loading
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


        {/* -----------------------------------------
            CR-005: Session Expired Message
            ----------------------------------------- */}
        {sessionExpired && (
          <p className="error">
            Your session has expired. Please log in again.
          </p>
        )}


        <form onSubmit={handleSubmit}>

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


          {error && !sessionExpired && (
            <p className="error">
              {error}
            </p>
          )}


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
            <FaSearch /> Browse the courses
          </Link>{" "}

          first.

        </p>


      </div>

    </>
  );
}


export default Login;