import { CookiePreferences } from "../redux/cookieConsent.store";

export interface CookieConsentData {
  hasConsent: boolean;
  preferences: CookiePreferences;
  timestamp: number;
}

const COOKIE_CONSENT_KEY = "cookie_consent";
const COOKIE_CONSENT_EXPIRY = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

/**
 * Get cookie consent data from localStorage
 */
export const getCookieConsent = (): CookieConsentData | null => {
  try {
    const storedData = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!storedData) return null;

    const parsedData: CookieConsentData = JSON.parse(storedData);

    // Check if consent has expired
    if (Date.now() - parsedData.timestamp > COOKIE_CONSENT_EXPIRY) {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      return null;
    }

    return parsedData;
  } catch (error) {
    console.error("Error reading cookie consent:", error);
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    return null;
  }
};

/**
 * Set cookie consent data to localStorage
 */
export const setCookieConsentToStorage = (
  hasConsent: boolean,
  preferences: CookiePreferences
): void => {
  try {
    const consentData: CookieConsentData = {
      hasConsent,
      preferences,
      timestamp: Date.now(),
    };

    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
  } catch (error) {
    console.error("Error storing cookie consent:", error);
  }
};









