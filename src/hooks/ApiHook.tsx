import axios, { AxiosError, AxiosRequestConfig } from "axios";

// RSA Public Key Management
let publicKey: string | null = null;

// Fetch RSA public key from backend
const fetchPublicKey = async (): Promise<string> => {
  if (publicKey) {
    return publicKey as string;
  }

  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/encrypt/public-key`
    );

    if (response.data.success && response.data.data.publicKey) {
      publicKey = response.data.data.publicKey;
      return publicKey as string;
    } else {
      throw new Error("Failed to fetch public key");
    }
  } catch (error) {
    console.error("Error fetching public key:", error);
    throw new Error("Cannot fetch encryption key");
  }
};

// Convert PEM to ArrayBuffer
const pemToArrayBuffer = (pem: string): ArrayBuffer => {
  const b64Lines = pem.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
  const byteString = atob(b64Lines);
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }
  return byteArray.buffer;
};

// RSA encryption using Web Crypto API
const rsaEncryptWithPublicKey = async (data: string): Promise<string> => {
  try {
    const publicKeyPem = await fetchPublicKey();

    // Import the public key
    const keyBuffer = pemToArrayBuffer(publicKeyPem);
    const cryptoKey = await crypto.subtle.importKey(
      "spki",
      keyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["encrypt"]
    );

    // Encrypt the data
    const dataBuffer = new TextEncoder().encode(data);
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      cryptoKey,
      dataBuffer
    );

    // Convert to base64 and make URL-safe
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));

    return encryptedBase64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  } catch (error) {
    console.error("RSA encryption error:", error);
    throw new Error("RSA encryption failed");
  }
};

// Hybrid encryption for large data (RSA + AES) - Frontend version
const hybridEncryptFrontend = async (data: string): Promise<string> => {
  try {
    // Generate AES key
    const aesKey = crypto.getRandomValues(new Uint8Array(32));
    const iv = crypto.getRandomValues(new Uint8Array(16));

    // Import AES key
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      aesKey,
      { name: "AES-CBC" },
      false,
      ["encrypt"]
    );

    // Encrypt data with AES
    const dataBuffer = new TextEncoder().encode(data);
    const encryptedData = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv },
      cryptoKey,
      dataBuffer
    );

    // Encrypt AES key with RSA
    const publicKeyPem = await fetchPublicKey();
    const keyBuffer = pemToArrayBuffer(publicKeyPem);
    const rsaKey = await crypto.subtle.importKey(
      "spki",
      keyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["encrypt"]
    );

    const encryptedKey = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      rsaKey,
      aesKey
    );

    // Combine components
    const encryptedKeyB64 = btoa(
      String.fromCharCode(...new Uint8Array(encryptedKey))
    );
    const ivHex = Array.from(iv)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const encryptedDataHex = Array.from(new Uint8Array(encryptedData))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const combined = `${encryptedKeyB64}:${ivHex}:${encryptedDataHex}`;

    return btoa(combined)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  } catch (error) {
    console.error("Hybrid encryption error:", error);
    throw new Error("Hybrid encryption failed");
  }
};

// Main encryption function - chooses method based on data size
const encryptUrlParam = async (value: string): Promise<string> => {
  try {
    // Check if Web Crypto API is available
    if (!crypto || !crypto.subtle) {
      console.warn("Web Crypto API not available, using fallback encryption");
      return fallbackEncryptUrlParam(value);
    }

    // Use direct RSA for small data, hybrid for larger data
    // RSA-OAEP with 2048-bit keys can encrypt max ~190 bytes
    if (value.length <= 180) {
      return await rsaEncryptWithPublicKey(value);
    } else {
      return await hybridEncryptFrontend(value);
    }
  } catch (error) {
    console.warn("RSA encryption failed, using fallback:", error);
    return fallbackEncryptUrlParam(value);
  }
};

// Fallback encryption for compatibility (simple obfuscation)
const fallbackEncryptUrlParam = (value: string): string => {
  try {
    const timestamp = Date.now().toString();
    const combined = timestamp + ":" + btoa(value);

    return btoa(combined)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  } catch (error) {
    console.warn("Fallback encryption failed, using original value:", error);
    return value;
  }
};

interface ApiRequestProps {
  method: "GET" | "PUT" | "DELETE" | "POST" | "PATCH";
  cookie?: boolean;
  url: string;
  data?: Record<string, unknown>;
  refreshtoken?: boolean;
  reactQuery?: boolean;
  encrypt?: string[]; // Array of URL parameter names to encrypt
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
  encrypt = [],
}: ApiRequestProps): Promise<ApiRequestReturnType> => {
  const accessToken = localStorage.getItem("accessToken");

  // Handle URL encryption if encrypt array is provided
  let processedUrl = url;
  if (encrypt.length > 0) {
    // Process URL to encrypt specified parameters
    const segments = url.split("/");
    const processedSegments = await Promise.all(
      segments.map(async (segment) => {
        // Check if this segment is a parameter that should be encrypted
        if (segment.startsWith(":")) {
          return segment; // Keep parameter placeholders as-is
        }

        // Check if this segment should be encrypted by checking if the previous segment was a parameter to encrypt
        const segmentIndex = segments.indexOf(segment);
        if (segmentIndex > 0) {
          const prevSegment = segments[segmentIndex - 1];
          const paramName = prevSegment.startsWith(":")
            ? prevSegment.slice(1)
            : "";
          if (
            encrypt.includes(paramName) &&
            segment &&
            !segment.startsWith(":")
          ) {
            return await encryptUrlParam(segment);
          }
        }

        return segment;
      })
    );
    processedUrl = processedSegments.join("/");
  }

  // Function to handle API requests
  const config: AxiosRequestConfig = {
    baseURL: import.meta.env.VITE_API_URL,
    url: processedUrl,
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
        const retryResponse = await axios({
          ...config,
          headers: header,
          url: processedUrl, // Use the processed URL with encryption
        });
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

// Interface for encrypted path response
interface EncryptedPathResponse {
  originalPath: string;
  encryptedPath: string;
  redirectUrl: string;
}

// Utility function to generate encrypted redirect URLs
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
    } else {
      throw new Error("Failed to encrypt path");
    }
  } catch (error) {
    console.error("Error generating encrypted redirect URL:", error);
    // Fallback to original path if encryption fails
    return originalPath;
  }
};

// Utility function to refresh the public key (for key rotation)
// eslint-disable-next-line react-refresh/only-export-components
export const refreshPublicKey = async (): Promise<void> => {
  publicKey = null; // Clear cached key
  await fetchPublicKey(); // Fetch fresh key
};
