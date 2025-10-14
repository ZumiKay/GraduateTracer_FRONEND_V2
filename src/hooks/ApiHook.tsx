import axios, { AxiosError, AxiosRequestConfig } from "axios";

interface ApiRequestProps {
  method: "GET" | "PUT" | "DELETE" | "POST" | "PATCH";
  cookie?: boolean;
  url: string;
  data?: Record<string, unknown>;
  refreshtoken?: boolean;
  reactQuery?: boolean;
}

interface ErrorResponse {
  message: string;
  code?: number;
  error?: string; // Added for enhanced error format from backend
  success?: boolean; // Added for consistency with backend response format
  status?: number; // Added for consistency with backend response format
  errors?: Array<{ message: string }>;
}

interface ApiError extends Error {
  status?: number;
  response?: {
    data?: ErrorResponse;
    status?: number;
  };
}

const RefreshToken = async () => {
  try {
    await axios({
      method: "POST",
      baseURL: import.meta.env.VITE_API_URL,
      url: "/refreshtoken",
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });
    return { success: true };
  } catch (error) {
    console.log("Refresh Token", error);
    return { success: false };
  }
};

export interface ApiRequestReturnType {
  success: boolean;
  data?: unknown;
  message?: string;
  error?: string; // Enhanced error field for specific error codes/types
  status?: number;
  reactQuery?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  // Enhanced error handling fields
  errors?: Array<{ message: string }>; // For validation errors
  details?: string; // For additional error details in development
}
const ApiRequest = async ({
  method,
  cookie,
  url,
  data,
  refreshtoken = false,
  reactQuery = false,
}: ApiRequestProps): Promise<ApiRequestReturnType> => {
  const accessToken = localStorage.getItem("accessToken");
  // Function to handle API requests
  const config: AxiosRequestConfig = {
    baseURL: import.meta.env.VITE_API_URL,
    url,
    method,
    withCredentials: !!cookie,
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken ? `Bearer ${accessToken}` : undefined, // Add token if exists
    },
    timeout: 10000,
    timeoutErrorMessage: "Request Timeout",
    data,
  };
  try {
    const response = await axios(config);

    return {
      success: true,
      data: response.data.data,
      status: response.status,
      message: response.data.message,
      pagination: response.data.pagination,
      reactQuery,
    };
  } catch (error) {
    console.log("Api Request Error", error);
    const err = error as AxiosError;

    // Handle timeout error
    if (err.code === "ECONNABORTED" || err.message === "Request Timeout") {
      console.error("Request timed out. Please try again later.");

      if (reactQuery) {
        // For React Query, throw the error to trigger error boundary
        throw new Error("Request timed out. Please try again later");
      }

      return {
        success: false,
        error: "Request timed out. Please try again later",
        reactQuery,
      };
    }

    if (err?.status === 401 && refreshtoken) {
      //Referesh Token
      const newAccesstoken = await RefreshToken();
      if (!newAccesstoken.success) {
        const errorMsg = "Login session expired";

        if (reactQuery) {
          throw new Error(errorMsg);
        }

        return {
          success: false,
          error: errorMsg,
          status: err.status,
          reactQuery,
        };
      }
      // Get the refreshed token from localStorage after successful refresh
      const refreshedToken = localStorage.getItem("accessToken");
      const header = {
        ...config.headers,
        Authorization: refreshedToken ? `Bearer ${refreshedToken}` : undefined,
      };
      //retry request
      try {
        const retryResponse = await axios({ ...config, headers: header });
        return {
          success: true,
          data: retryResponse.data.data,
          status: retryResponse.status,
          message: retryResponse.data.message,
          pagination: retryResponse.data.pagination,
          reactQuery,
        };
      } catch (retryError) {
        const retryErrorMsg = (retryError as AxiosError).message;

        if (reactQuery) {
          throw new Error(retryErrorMsg);
        }

        return {
          success: false,
          error: retryErrorMsg,
          reactQuery,
        };
      }
    }

    const errorResponse = err.response?.data as ErrorResponse;

    // Enhanced error message extraction to handle improved backend error format
    let errorMessage = "Error Occurred";

    if (errorResponse) {
      // Check for new enhanced error format
      if (errorResponse.message && errorResponse.error) {
        errorMessage = `${errorResponse.message} (${errorResponse.error})`;
      }
      // Check for validation errors
      else if (
        errorResponse.errors &&
        Array.isArray(errorResponse.errors) &&
        errorResponse.errors.length > 0
      ) {
        errorMessage =
          errorResponse.errors[0]?.message ||
          errorResponse.message ||
          "Validation error";
      }
      // Check for simple message
      else if (errorResponse.message) {
        errorMessage = errorResponse.message;
      }
      // Fallback to axios error message
      else {
        errorMessage = err.message || "Unknown error";
      }
    } else {
      errorMessage = err.message || "Network error";
    }

    if (reactQuery) {
      // For React Query, throw the error to be handled by error boundaries
      const error = new Error(errorMessage) as ApiError;
      error.status = err.status;
      error.response = {
        data: err.response?.data as ErrorResponse,
        status: err.response?.status,
      };
      throw error;
    }

    return {
      success: false,
      status: err.status,
      error: errorMessage,
      message: errorResponse?.message, // Include original message for debugging
      reactQuery,
    };
  }
};

// Wrapper function specifically for React Query
// eslint-disable-next-line react-refresh/only-export-components
export const createQueryFn = (
  requestConfig: Omit<ApiRequestProps, "reactQuery">
) => {
  return async () => {
    const response = await ApiRequest({ ...requestConfig, reactQuery: true });
    return response;
  };
};

// Wrapper for mutation functions
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
export default ApiRequest;
