import { Navigate, useLocation } from "react-router-dom";

import { getUser, getToken } from "../services/auth";


function ProtectedRoute({ children, role }) {

  const location = useLocation();

  const token = getToken();
  const user = getUser();


  // =====================================================
  // 1. NOT LOGGED IN
  // =====================================================

  if (!token || !user) {

    const requestedPath =
      location.pathname +
      location.search +
      location.hash;


    return (
      <Navigate
        to="/login"
        state={{
          from: requestedPath,
        }}
        replace
      />
    );
  }


  // =====================================================
  // 2. LOGGED IN BUT WRONG ROLE
  // =====================================================

  if (role && user.role !== role) {

    return (
      <div className="access-denied-page">

        <div className="access-denied-card">

          <h1>
            Access denied
          </h1>

          <p>
            You do not have permission to access this page.
          </p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {

              if (user.role === "admin") {
                window.location.href = "/admin";
              } else {
                window.location.href = "/student";
              }

            }}
          >
            Go to my area
          </button>

        </div>

      </div>
    );

  }


  // =====================================================
  // 3. AUTHENTICATED + CORRECT ROLE
  // =====================================================

  return children;
}


export default ProtectedRoute;