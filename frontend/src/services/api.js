import axios from "axios";
import { clearAuth } from "./auth";


const api = axios.create({
  baseURL: "http://localhost:3000/api",
});


// =====================================================
// ADD JWT TOKEN TO REQUESTS
// =====================================================

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


// =====================================================
// GLOBAL RESPONSE INTERCEPTOR
// Handles expired / invalid JWT sessions
// =====================================================

let sessionExpiryRedirecting = false;


api.interceptors.response.use(

  // ---------- Successful response ----------
  (response) => {
    return response;
  },


  // ---------- Failed response ----------
  (error) => {

    const status = error.response?.status;

    const requestUrl = error.config?.url || "";


    // Login request itself must NOT trigger
    // the session-expired redirect.
    const isLoginRequest =
      requestUrl.includes("/auth/login");


    // Only authenticated API requests returning
    // 401 should trigger session expiry handling.
    if (
      status === 401 &&
      !isLoginRequest &&
      localStorage.getItem("token")
    ) {

      // Prevent multiple API requests from
      // causing multiple redirects.
      if (!sessionExpiryRedirecting) {

        sessionExpiryRedirecting = true;


        // Remove old authentication data.
        clearAuth();


        // Remember the page the user was using.
        const currentPage =
          window.location.pathname +
          window.location.search +
          window.location.hash;


        sessionStorage.setItem(
          "redirectAfterLogin",
          currentPage
        );


        // Tell Login page why the user was redirected.
        sessionStorage.setItem(
          "sessionExpired",
          "true"
        );


        // Redirect to Login.
        window.location.replace("/login");

      }

    }


    // 403 is NOT handled here.
    // It should not automatically logout the user.

    // Network errors are also NOT handled here.
    // They should not clear authentication data.


    return Promise.reject(error);

  }

);


export default api;