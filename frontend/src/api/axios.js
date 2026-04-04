import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true,
});

let csrfMemoryToken = null;

/**
 * Fetches a fresh CSRF token from the backend and stores it in memory.
 * Call this once at app startup (e.g. in main.jsx or App.jsx).
 */
export const initCsrf = async () => {
  try {
    const { data } = await api.get("/token/csrf-token");
    csrfMemoryToken = data?.csrfToken || null;
  } catch (err) {
    console.error("[CSRF] Failed to initialise CSRF token:", err.message);
  }
};

let isRefreshing = false;
let refreshQueue = [];

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

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // Inject CSRF token from memory (works cross-origin unlike document.cookie)
    if (csrfMemoryToken) {
      config.headers["x-csrf-token"] = csrfMemoryToken;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

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
        processQueue(refreshError, null);
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // CSRF token expired or invalid — fetch a fresh one and retry once
    if (
      error.response?.status === 403 &&
      (error.response.data?.message === "Invalid CSRF token." ||
        error.response.data?.message === "Invalid CSRF token" ||
        error.response.data?.code === "EBADCSRFTOKEN")
    ) {
      if (!originalRequest._csrfRetry) {
        originalRequest._csrfRetry = true;
        try {
          // Re-fetch and store the new token, then inject it before replaying
          await initCsrf();
          if (csrfMemoryToken) {
            originalRequest.headers["x-csrf-token"] = csrfMemoryToken;
          }
          return api(originalRequest);
        } catch (csrfError) {
          console.error("[CSRF] Failed to refresh CSRF token:", csrfError);
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
