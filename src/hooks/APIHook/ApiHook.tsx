import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";

/* ----------------------------- Type Definition ---------------------------- */

export interface ApiRequestProps {
  method: "GET" | "PUT" | "DELETE" | "POST" | "PATCH";
  url: string;
  data?: Record<string, unknown>;
  returnawait?: true;
  cookie?: boolean;
  reactQuery?: boolean;
  encrypt?: boolean;
  timeout?: number;
  skipRefresh?: boolean; // Skip token refresh for this request
  throwError?: boolean;
}

interface ErrorResponse {
  message: string;
  error?: string;
  code?: number;
  status?: number;
  success?: boolean;
  errors?: Array<{ message: string }>;
}

export interface ApiError extends Error {
  status?: number;
  response?: {
    data?: ErrorResponse;
    status?: number;
  };
}

export interface ApiRequestReturnType {
  success: boolean;
  data?: unknown;
  message?: string;
  error?: string;
  status?: number;
  reactQuery?: boolean;
  session?: {
    isExpired?: boolean;
    isValid?: boolean;
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  errors?: Array<{ message: string }>;
  details?: string;
  errorResponses?: ErrorResponse;
}

/* -------------------------------- Constant -------------------------------- */
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL,
  TIMEOUT: 10000,
  HEADERS: {
    "Content-Type": "application/json",
  },
  REFRESH_TOKEN_URL: "/refreshtoken",
} as const;

const ERROR_MESSAGES = {
  TIMEOUT: "Request timed out. Please try again later",
  NETWORK: "Network error",
  UNKNOWN: "Error Occurred",
  VALIDATION: "Validation error",
  ENCRYPTION_FAILED: "Encryption failed",
  REFRESH_FAILED: "Session expired. Please login again",
} as const;

//Create axios instance
const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

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

/* ---------------------------- Axios Interceptor --------------------------- */

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Attach browser fingerprint headers for submitonce duplicate detection
    try {
      if (typeof screen !== "undefined") {
        config.headers["X-Screen-Resolution"] =
          `${screen.width}x${screen.height}`;
      }
      if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
        config.headers["X-Timezone"] =
          Intl.DateTimeFormat().resolvedOptions().timeZone;
      }
      if (typeof navigator !== "undefined" && navigator.platform) {
        config.headers["X-Platform"] = navigator.platform;
      }
    } catch {
      // Silently ignore fingerprint collection errors
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

/**
 * Response Interceptor
 * Handles token refresh on unauthenticate requests
 */

const skipRefreshTokenUrl = ["response/respondentlogin", "/registeruser"];

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      skipRefresh?: boolean;
    };

    // Check if request should skip refresh or is already a retry
    if (
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.skipRefresh
    ) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      originalRequest.url &&
      !skipRefreshTokenUrl.some((i) => originalRequest.url?.includes(i))
    ) {
      if (originalRequest.url === API_CONFIG.REFRESH_TOKEN_URL) {
        isRefreshing = false;
        processQueue(new Error(ERROR_MESSAGES.REFRESH_FAILED));
        window.location.href = "/";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue requests while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axiosInstance.post(API_CONFIG.REFRESH_TOKEN_URL, {}, {
          skipRefresh: true,
          withCredentials: true,
        } as AxiosRequestConfig & { skipRefresh?: boolean });
        isRefreshing = false;
        processQueue();

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed
        isRefreshing = false;
        processQueue(refreshError as Error);

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("app:session-expired"));
        }

        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("app:session-expired"));
    }

    return Promise.reject(error);
  },
);

/* ----------------------------- Error Handling ----------------------------- */

const extractErrorMessage = (
  errorResponse: ErrorResponse | undefined,
  axiosError: AxiosError,
): string => {
  if (!errorResponse) {
    return axiosError.message || ERROR_MESSAGES.NETWORK;
  }

  if (errorResponse.message && errorResponse.error) {
    return `${errorResponse.message} (${errorResponse.error})`;
  }

  // Validation errors
  if (errorResponse.errors?.length) {
    return (
      errorResponse.errors[0]?.message ||
      errorResponse.message ||
      ERROR_MESSAGES.VALIDATION
    );
  }

  if (errorResponse.message) {
    return errorResponse.message;
  }

  return axiosError.message || ERROR_MESSAGES.UNKNOWN;
};

const handleTimeoutError = (
  reactQuery: boolean,
): never | ApiRequestReturnType => {
  console.error(ERROR_MESSAGES.TIMEOUT);

  if (reactQuery) {
    throw new Error(ERROR_MESSAGES.TIMEOUT);
  }

  return {
    success: false,
    error: ERROR_MESSAGES.TIMEOUT,
    reactQuery,
  };
};

/**
 * Creates an API error for React Query
 */
const createApiError = (
  message: string,
  status: number | undefined,
  errorResponse: ErrorResponse | undefined,
): ApiError => {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.response = {
    data: errorResponse,
    status,
  };
  return error;
};

/* --------------------------- API Request Helper --------------------------- */

const ApiRequest = async ({
  method,
  url,
  data,
  cookie = false,
  reactQuery = false,
  timeout = API_CONFIG.TIMEOUT,
  skipRefresh = false,
  returnawait,
}: ApiRequestProps): Promise<ApiRequestReturnType> => {
  const config: AxiosRequestConfig & { skipRefresh?: boolean } = {
    url,
    method,
    withCredentials: cookie,
    timeout,
    timeoutErrorMessage: ERROR_MESSAGES.TIMEOUT,
    data,
    skipRefresh,
  };

  if (returnawait) {
    return await axiosInstance(config);
  }

  try {
    const response = await axiosInstance(config);

    return {
      success: true,
      data: response.data.data,
      status: response.status,
      message: response.data.message,
      pagination: response.data.pagination,
      reactQuery,
    };
  } catch (error) {
    const axiosError = error as AxiosError;

    // Handle timeout errors
    if (
      axiosError.code === "ECONNABORTED" ||
      axiosError.message === ERROR_MESSAGES.TIMEOUT
    ) {
      return handleTimeoutError(reactQuery);
    }

    const errorResponse = axiosError.response?.data as
      | ErrorResponse
      | undefined;
    const errorMessage = extractErrorMessage(errorResponse, axiosError);

    if (reactQuery) {
      throw createApiError(errorMessage, axiosError.status, errorResponse);
    }

    return {
      success: false,
      status: axiosError.status,
      error: errorMessage,
      message: errorResponse?.message,
      reactQuery,
      errorResponses: errorResponse,
    };
  }
};

export default ApiRequest;
