import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
});



api.interceptors.request.use(
  (config) => {

    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);




let isRedirectingToLogin = false;

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {

    // Get HTTP response status
    const status = error.response?.status;

    // Get requested URL
    const requestURL = error.config?.url || "";

    // --------------------------------
    // Network Error
    // --------------------------------
    // No HTTP response means it is a
    // network/server connection problem.
    // Do NOT logout the user.
    // --------------------------------
    if (!error.response) {
      return Promise.reject(error);
    }


    if (status === 401) {

      // IMPORTANT:
      // Do not treat the Login request's
      // 401 as session expiry.
      if (requestURL.includes("/login")) {
        return Promise.reject(error);
      }


      // Prevent multiple simultaneous
      // 401 responses from causing
      // multiple redirects.
      if (!isRedirectingToLogin) {

        isRedirectingToLogin = true;

        // Save the page the user was
        // currently trying to access.
        const currentPath =
          window.location.pathname +
          window.location.search +
          window.location.hash;

        // Do not save /login itself.
        if (currentPath !== "/login") {
          localStorage.setItem(
            "redirectAfterLogin",
            currentPath
          );
        }


        // Clear authentication data
        localStorage.removeItem("token");
        localStorage.removeItem("user");


        // Redirect to Login page
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }


    // --------------------------------
    // HTTP 403 Forbidden
    // --------------------------------
    // Do NOT logout the user.
    // ProtectedRoute / component can
    // handle access denied.
    // --------------------------------
    if (status === 403) {
      return Promise.reject(error);
    }


    // --------------------------------
    // Other errors
    // --------------------------------
    return Promise.reject(error);
  }
);


export default api;
