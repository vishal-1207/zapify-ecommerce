import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

const getCookie = (name) => {
  if (!document.cookie) return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return decodeURIComponent(match[2]);
  return null;
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    const csrfToken =
      getCookie("XSRF-TOKEN") || getCookie("_csrf") || getCookie("csrfToken");

    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
      config.headers["x-csrf-token"] = csrfToken;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 Unauthorized or Session Expired
    if (error.response?.status === 401) {
      const data = error.response.data;
      if (
        data?.message === "jwt expired" ||
        data?.error === "jwt expired" ||
        data?.message === "Unauthorized access. Please log in." ||
        data?.message === "No token provided." ||
        data?.message === "Token expired. Please refresh session." ||
        data?.message === "Access token missing."
      ) {
        // Clear session
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Redirect to login if not already there
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    }

    // Handle CSRF Token Errors with Auto-Retry
    if (
      error.response?.status === 403 &&
      (error.response.data?.message === "Invalid CSRF token" ||
        error.response.data?.code === "EBADCSRFTOKEN")
    ) {
      const originalRequest = error.config;

      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          console.log("Refreshing CSRF Token...");
          // Fetch new token (this sets the cookie)
          // We use axios directly to avoid circular dependency or interceptor loops for this specific call if needed,
          // but api instance is fine as long as this specific call doesn't trigger 403 loop.
          // But since 403 checks for header, and GET request might not need CSRF?
          // Actually, GET requests don't need CSRF. So it should be fine.
          await api.get("/token/csrf-token");

          // The request interceptor will pick up the new cookie
          return api(originalRequest);
        } catch (refreshError) {
          console.error("Failed to refresh CSRF token", refreshError);
          // If refresh fails, we might want to redirect to login or just let the error propagate
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
