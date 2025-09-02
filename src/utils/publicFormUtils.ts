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

export const supportsGuestAccess = (formType: string): boolean => {
  return formType === "QUIZ";
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export interface GuestData {
  name: string;
  email: string;
  timestamp?: number;
}

export const storeGuestData = (guestData: GuestData): void => {
  const dataWithTimestamp = {
    ...guestData,
    timestamp: Date.now(),
  };
  sessionStorage.setItem("guestData", JSON.stringify(dataWithTimestamp));
};

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

export const clearGuestData = (): void => {
  sessionStorage.removeItem("guestData");
};

export const isGuestSessionActive = (): boolean => {
  return getGuestData() !== null;
};

export const validateGuestEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
