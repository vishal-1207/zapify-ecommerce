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

// ─── Silent Refresh State ────────────────────────────────────────────────────
// Tracks whether a refresh is already in-flight so concurrent expired requests
// don't each trigger their own /auth/refresh-token call.
let isRefreshing = false;
let refreshQueue = []; // callbacks waiting for the new access token

const processQueue = (error, accessToken = null) => {
  refreshQueue.forEach((cb) =>
    error ? cb.reject(error) : cb.resolve(accessToken),
  );
  refreshQueue = [];
};

const redirectToLogin = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  if (!window.location.pathname.includes("/login")) {
    window.location.href = "/login";
  }
};
// ─────────────────────────────────────────────────────────────────────────────

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
    const originalRequest = error.config;

    // ── Silent Access Token Refresh ─────────────────────────────────────────
    // Trigger when the server tells us the access token has expired,
    // but only once per request (guard with _retry flag).
    const isAccessTokenExpired =
      error.response?.status === 401 &&
      !originalRequest._retry &&
      (error.response.data?.message ===
        "Token expired. Please refresh session." ||
        error.response.data?.message === "Access token missing." ||
        error.response.data?.message === "jwt expired");

    if (isAccessTokenExpired) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Another refresh is already in flight — queue this request.
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (accessToken) => {
              originalRequest.headers["Authorization"] =
                `Bearer ${accessToken}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const { data } = await api.post("/auth/refresh-token");
        const newAccessToken = data?.data?.accessToken;

        if (!newAccessToken)
          throw new Error("No access token in refresh response.");

        localStorage.setItem("token", newAccessToken);
        api.defaults.headers.common["Authorization"] =
          `Bearer ${newAccessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token is expired or invalid — require fresh login.
        processQueue(refreshError, null);
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    // ── CSRF Token Auto-Retry ────────────────────────────────────────────────
    if (
      error.response?.status === 403 &&
      (error.response.data?.message === "Invalid CSRF token" ||
        error.response.data?.code === "EBADCSRFTOKEN")
    ) {
      if (!originalRequest._csrfRetry) {
        originalRequest._csrfRetry = true;
        try {
          await api.get("/token/csrf-token");
          return api(originalRequest);
        } catch (csrfError) {
          console.error("Failed to refresh CSRF token", csrfError);
        }
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    return Promise.reject(error);
  },
);

export default api;
