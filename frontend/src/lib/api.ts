import axios from "axios";

// Falls back to localhost so `npm run dev` keeps working with zero setup —
// only production deploys need VITE_API_URL actually set (to the deployed
// backend's URL, e.g. https://your-backend.onrender.com/api).
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the access token to every outgoing request, if one exists.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If a request fails with 401 (expired/invalid access token), try refreshing
// once, then retry the original request. Prevents forcing a re-login every
// 15 minutes just because the access token expired.
//
// Several requests can 401 at the same moment (e.g. the dashboard fires off
// transactions/budgets/goals/categories in parallel on load). Without
// dedup, each one would independently call /api/auth/refresh, and since
// refresh tokens rotate server-side, only the first call's new token stays
// valid — the rest would fail or (previously) crash the backend on a
// duplicate-token race. `refreshPromise` ensures only one refresh request is
// ever in flight; everyone else just waits on the same promise.
let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

async function refreshTokens() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    throw new Error("No refresh token available.");
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
      .then(({ data }) => {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const data = await refreshTokens();
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);