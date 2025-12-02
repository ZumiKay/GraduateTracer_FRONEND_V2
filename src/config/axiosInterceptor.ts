import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// ==================== Types ====================

interface TokenRefreshQueue {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}

interface ErrorResponseData {
  success: boolean;
  error?: string;
  message?: string;
  shouldRefresh?: boolean;
}

// ==================== State Management ====================

let isRefreshing = false;
let failedQueue: TokenRefreshQueue[] = [];

/**
 * Process all queued requests after token refresh
 */
const processQueue = (error: Error | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });

  failedQueue = [];
};

// ==================== Axios Interceptor Setup ====================

export const setupAxiosInterceptors = () => {
  // Request Interceptor (optional - for logging)
  axios.interceptors.request.use(
    (config) => {
      // You can add request logging here if needed
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response Interceptor - Handle token expiration
  axios.interceptors.response.use(
    (response) => {
      // Successfull
      return response;
    },
    async (error: AxiosError<ErrorResponseData>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // Check if this is a token expiration error
      const errorData = error.response?.data;
      const isTokenExpired =
        error.response?.status === 401 &&
        (errorData?.error === "TOKEN_EXPIRED" ||
          errorData?.shouldRefresh === true);

      // If not token expired, or already retried, reject immediately
      if (!isTokenExpired || originalRequest._retry) {
        // Handle specific error cases
        if (
          error.response?.status === 401 &&
          errorData?.error === "TOKEN_MISSING"
        ) {
          // No token - redirect to login
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }

        return Promise.reject(error);
      }

      // Handle token refresh
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axios(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Mark as retrying and start refresh process
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // refresh tokne
        await axios.post(
          `${import.meta.env.VITE_API_URL}/refreshtoken`,
          {},
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        // Process all queued requests
        processQueue();

        // Retry the original request
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear queue and redirect to login
        console.error("Token refresh failed:", refreshError);
        processQueue(refreshError as Error);

        // Clear any stored session data
        localStorage.clear();

        // Redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );
};

/**
 * Manually trigger token refresh
 * Useful for proactive refresh before token expires
 */
export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    await axios.post(
      `${import.meta.env.VITE_API_URL}/refreshtoken`,
      {},
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return true;
  } catch (error) {
    console.error("Manual token refresh failed:", error);
    return false;
  }
};

/**
 * Check if we should proactively refresh the token
 * Call this periodically (e.g., every 5 minutes)
 */
export const checkAndRefreshToken = async (): Promise<void> => {
  try {
    await refreshAccessToken();
  } catch {
    // Silently fail - the interceptor will handle it on next request
    console.log("Proactive token refresh skipped");
  }
};
