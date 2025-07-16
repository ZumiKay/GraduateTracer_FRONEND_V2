/**
 * Utility functions for public form access
 */

/**
 * Generate a public form access URL
 * @param formId - The form ID
 * @param token - Optional security token
 * @returns The public form access URL
 */
export const generatePublicFormURL = (
  formId: string,
  token?: string
): string => {
  const baseURL = window.location.origin;
  if (token) {
    return `${baseURL}/form-access/${formId}/${token}`;
  }
  return `${baseURL}/form-access/${formId}`;
};

/**
 * Extract form ID and token from a public form URL
 * @param url - The public form URL
 * @returns Object with formId and optional token
 */
export const parsePublicFormURL = (
  url: string
): { formId: string; token?: string } => {
  const urlParts = url.split("/");
  const formAccessIndex = urlParts.findIndex((part) => part === "form-access");

  if (formAccessIndex === -1) {
    throw new Error("Invalid public form URL");
  }

  const formId = urlParts[formAccessIndex + 1];
  const token = urlParts[formAccessIndex + 2];

  return { formId, token };
};

/**
 * Check if a form type supports guest access
 * @param formType - The form type
 * @returns Whether guest access is supported
 */
export const supportsGuestAccess = (formType: string): boolean => {
  return formType === "QUIZ";
};

/**
 * Validate email format
 * @param email - Email to validate
 * @returns Whether email is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Guest session management
 */
export interface GuestData {
  name: string;
  email: string;
  timestamp?: number;
}

/**
 * Store guest data in session storage
 * @param guestData - Guest user data
 */
export const storeGuestData = (guestData: GuestData): void => {
  const dataWithTimestamp = {
    ...guestData,
    timestamp: Date.now(),
  };
  sessionStorage.setItem("guestData", JSON.stringify(dataWithTimestamp));
};

/**
 * Retrieve guest data from session storage
 * @returns Guest data if available, null otherwise
 */
export const getGuestData = (): GuestData | null => {
  try {
    const storedData = sessionStorage.getItem("guestData");
    if (!storedData) return null;

    const parsedData = JSON.parse(storedData);

    // Check if session is still valid (24 hours)
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (
      parsedData.timestamp &&
      Date.now() - parsedData.timestamp > sessionDuration
    ) {
      clearGuestData();
      return null;
    }

    return parsedData;
  } catch (error) {
    console.error("Error parsing guest data:", error);
    clearGuestData();
    return null;
  }
};

/**
 * Clear guest data from session storage
 */
export const clearGuestData = (): void => {
  sessionStorage.removeItem("guestData");
};

/**
 * Check if guest session is active
 * @returns Whether guest session is active
 */
export const isGuestSessionActive = (): boolean => {
  return getGuestData() !== null;
};

/**
 * Validate guest email format
 * @param email - Email to validate
 * @returns Whether email is valid
 */
export const validateGuestEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
