import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";

// ==================== Type Definitions ====================

interface ApiRequestProps {
  method: "GET" | "PUT" | "DELETE" | "POST" | "PATCH";
  url: string;
  data?: Record<string, unknown>;
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

interface ApiError extends Error {
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

interface EncryptedPathResponse {
  originalPath: string;
  encryptedPath: string;
  redirectUrl: string;
}

interface PublicKeyResponse {
  publicKey: string;
}

// ==================== Constants ====================

const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL,
  TIMEOUT: 10000,
  HEADERS: {
    "Content-Type": "application/json",
  },
  REFRESH_TOKEN_URL: "/refreshtoken", // Update with your actual refresh endpoint
} as const;

const PEM_MARKERS = {
  HEADER: "-----BEGIN PUBLIC KEY-----",
  FOOTER: "-----END PUBLIC KEY-----",
} as const;

const ERROR_MESSAGES = {
  TIMEOUT: "Request timed out. Please try again later",
  NETWORK: "Network error",
  UNKNOWN: "Error Occurred",
  VALIDATION: "Validation error",
  ENCRYPTION_FAILED: "Encryption failed",
  REFRESH_FAILED: "Session expired. Please login again",
} as const;

// ==================== Axios Instance ====================

const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
  withCredentials: true,
});

// ==================== Token Refresh State ====================

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

// ==================== Axios Interceptors ====================

/**
 * Request Interceptor
 * Adds skip refresh flag to request config
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles token refresh on 401 errors
 */
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

    if (error.response?.status === 401) {
      if (originalRequest.url === API_CONFIG.REFRESH_TOKEN_URL) {
        // Refresh token is invalid, redirect to login
        isRefreshing = false;
        processQueue(new Error(ERROR_MESSAGES.REFRESH_FAILED));
        window.location.href = "/login";
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
        } as InternalAxiosRequestConfig & { skipRefresh?: boolean });

        isRefreshing = false;
        processQueue();

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed
        isRefreshing = false;
        processQueue(refreshError as Error);

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ==================== Encryption Utilities ====================

/**
 * Fetches the public key for encryption
 */
const getPublicKey = async (): Promise<PublicKeyResponse | null> => {
  try {
    const response = await axiosInstance.get("/de/public-key");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch public key:", error);
    return null;
  }
};

/**
 * Converts a PEM-formatted public key to a CryptoKey
 */
const importPublicKey = async (pemKey: string): Promise<CryptoKey> => {
  const pemContents = pemKey
    .replace(PEM_MARKERS.HEADER, "")
    .replace(PEM_MARKERS.FOOTER, "")
    .replace(/\s/g, "");

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  return await window.crypto.subtle.importKey(
    "spki",
    binaryDer.buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
};

/**
 * Encrypts a string using RSA-OAEP with the provided public key
 */
const encryptString = async (
  plainText: string,
  publicKey: string
): Promise<string | null> => {
  try {
    const cryptoKey = await importPublicKey(publicKey);
    const encodedText = new TextEncoder().encode(plainText);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      cryptoKey,
      encodedText
    );

    const encryptedArray = new Uint8Array(encryptedBuffer);
    const binary = String.fromCharCode(...encryptedArray);
    return btoa(binary);
  } catch (error) {
    console.error("Encryption failed:", error);
    return null;
  }
};

/**
 * Processes URL encryption if required
 */
const processUrlEncryption = async (url: string): Promise<string> => {
  const keyResponse = await getPublicKey();
  if (!keyResponse?.publicKey) {
    throw new Error(ERROR_MESSAGES.ENCRYPTION_FAILED);
  }

  const encryptedUrl = await encryptString(url, keyResponse.publicKey);
  if (!encryptedUrl) {
    throw new Error(ERROR_MESSAGES.ENCRYPTION_FAILED);
  }

  return encryptedUrl;
};

// ==================== Error Handling ====================

/**
 * Extracts a meaningful error message from the error response
 */
const extractErrorMessage = (
  errorResponse: ErrorResponse | undefined,
  axiosError: AxiosError
): string => {
  if (!errorResponse) {
    return axiosError.message || ERROR_MESSAGES.NETWORK;
  }

  // Enhanced error format: message + error code
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

  // Simple message
  if (errorResponse.message) {
    return errorResponse.message;
  }

  return axiosError.message || ERROR_MESSAGES.UNKNOWN;
};

/**
 * Handles timeout errors
 */
const handleTimeoutError = (
  reactQuery: boolean
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
  errorResponse: ErrorResponse | undefined
): ApiError => {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.response = {
    data: errorResponse,
    status,
  };
  return error;
};

// ==================== Main API Request Function ====================

/**
 * Makes an HTTP request to the API with optional encryption support
 */
const ApiRequest = async ({
  method,
  url,
  data,
  cookie = false,
  reactQuery = false,
  encrypt = false,
  timeout = API_CONFIG.TIMEOUT,
  skipRefresh = false,
}: ApiRequestProps): Promise<ApiRequestReturnType> => {
  // Handle URL encryption if needed
  let processedUrl = url;
  if (encrypt) {
    try {
      processedUrl = await processUrlEncryption(url);
    } catch (error) {
      console.error("URL encryption failed:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : ERROR_MESSAGES.ENCRYPTION_FAILED,
      };
    }
  }

  // Configure request
  const config: AxiosRequestConfig & { skipRefresh?: boolean } = {
    url: processedUrl,
    method,
    withCredentials: cookie,
    timeout,
    timeoutErrorMessage: ERROR_MESSAGES.TIMEOUT,
    data,
    skipRefresh,
  };

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

    // For React Query, throw the error
    if (reactQuery) {
      throw createApiError(errorMessage, axiosError.status, errorResponse);
    }

    // For regular requests, return error object
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

// ==================== React Query Helpers ====================

/**
 * Creates a query function for React Query
 * @example
 * const query = useQuery({
 *   queryKey: ['user', userId],
 *   queryFn: createQueryFn({ method: 'GET', url: `/user/${userId}`, cookie: true })
 * })
 */
// eslint-disable-next-line react-refresh/only-export-components
export const createQueryFn = (
  requestConfig: Omit<ApiRequestProps, "reactQuery">
) => {
  return async () => {
    return await ApiRequest({ ...requestConfig, reactQuery: true });
  };
};

/**
 * Creates a mutation function for React Query
 * @example
 * const mutation = useMutation({
 *   mutationFn: createMutationFn({ method: 'POST', url: '/user', cookie: true })
 * })
 */
// eslint-disable-next-line react-refresh/only-export-components
export const createMutationFn = (
  requestConfig: Omit<ApiRequestProps, "reactQuery" | "data">
) => {
  return async (data?: Record<string, unknown>) => {
    const response = await ApiRequest({
      ...requestConfig,
      data,
      reactQuery: true,
    });
    return response.data;
  };
};

// ==================== Utility Functions ====================

/**
 * Generates an encrypted redirect URL for secure navigation
 * @param originalPath - The path to encrypt
 * @returns The encrypted redirect URL or the original path if encryption fails
 */
// eslint-disable-next-line react-refresh/only-export-components
export const generateEncryptedRedirectUrl = async (
  originalPath: string
): Promise<string> => {
  try {
    const response = await ApiRequest({
      method: "POST",
      url: "/encrypt/encrypt-path",
      data: { path: originalPath },
    });

    if (response.success && response.data) {
      const encryptedData = response.data as EncryptedPathResponse;
      return encryptedData.redirectUrl;
    }

    throw new Error("Failed to encrypt path");
  } catch (error) {
    console.error("Error generating encrypted redirect URL:", error);
    return originalPath;
  }
};

/**
 * Manually triggers a token refresh
 * Useful for pre-emptive token refresh before making critical requests
 */
// eslint-disable-next-line react-refresh/only-export-components
export const refreshToken = async (): Promise<boolean> => {
  try {
    await axiosInstance.post(API_CONFIG.REFRESH_TOKEN_URL, {}, {
      skipRefresh: true,
      withCredentials: true,
    } as AxiosRequestConfig & { skipRefresh?: boolean });
    return true;
  } catch (error) {
    console.error("Manual token refresh failed:", error);
    return false;
  }
};

export default ApiRequest;
