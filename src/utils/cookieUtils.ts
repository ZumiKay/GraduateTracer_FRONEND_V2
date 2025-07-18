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

/**
 * Clear cookie consent data from localStorage
 */
export const clearCookieConsent = (): void => {
  try {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
  } catch (error) {
    console.error("Error clearing cookie consent:", error);
  }
};

/**
 * Check if a specific cookie category is allowed
 */
export const isCookieAllowed = (category: keyof CookiePreferences): boolean => {
  const consentData = getCookieConsent();
  if (!consentData) return false;

  return consentData.preferences[category];
};

/**
 * Set a cookie with consent check
 */
export const setCookieWithConsent = (
  name: string,
  value: string,
  category: keyof CookiePreferences,
  options: {
    expires?: Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
  } = {}
): boolean => {
  // Always allow necessary cookies
  if (category === "necessary" || isCookieAllowed(category)) {
    const {
      expires,
      path = "/",
      domain,
      secure = false,
      sameSite = "lax",
    } = options;

    let cookieString = `${name}=${value}; path=${path}; SameSite=${sameSite}`;

    if (expires) {
      cookieString += `; expires=${expires.toUTCString()}`;
    }

    if (domain) {
      cookieString += `; domain=${domain}`;
    }

    if (secure) {
      cookieString += "; secure";
    }

    document.cookie = cookieString;
    return true;
  }

  return false;
};

/**
 * Get a cookie value
 */
export const getCookieValue = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
};

/**
 * Delete a cookie
 */
export const deleteCookie = (
  name: string,
  path: string = "/",
  domain?: string
): void => {
  let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  document.cookie = cookieString;
};

/**
 * Clear all non-necessary cookies based on current consent
 */
export const clearNonConsentedCookies = (): void => {
  const consentData = getCookieConsent();
  if (!consentData) return;

  // Get all cookies
  const cookies = document.cookie.split(";");

  cookies.forEach((cookie) => {
    const [name] = cookie.trim().split("=");

    // Define cookie categories (you may need to adjust this based on your actual cookies)
    const functionalCookies = ["theme", "language", "user_preferences"];
    const analyticsCookies = ["_ga", "_gid", "_gat", "analytics"];
    const marketingCookies = ["_fbp", "_gcl_au", "marketing", "ads"];

    // Don't delete necessary cookies
    const necessaryCookies = ["access_token", "refresh_token", "session_id"];

    if (necessaryCookies.includes(name)) {
      return;
    }

    // Check if cookie should be deleted based on consent
    if (
      functionalCookies.includes(name) &&
      !consentData.preferences.functional
    ) {
      deleteCookie(name);
    } else if (
      analyticsCookies.includes(name) &&
      !consentData.preferences.analytics
    ) {
      deleteCookie(name);
    } else if (
      marketingCookies.includes(name) &&
      !consentData.preferences.marketing
    ) {
      deleteCookie(name);
    }
  });
};

/**
 * Analytics tracking helpers
 */
export const trackEvent = (eventName: string, eventData?: object): void => {
  if (!isCookieAllowed("analytics")) return;

  // Implement your analytics tracking here
  console.log(`Analytics Event: ${eventName}`, eventData);

  // Example: Google Analytics
  // if (typeof gtag !== 'undefined') {
  //   gtag('event', eventName, eventData);
  // }
};

/**
 * Marketing tracking helpers
 */
export const trackConversion = (conversionData?: object): void => {
  if (!isCookieAllowed("marketing")) return;

  // Implement your marketing tracking here
  console.log("Marketing Conversion:", conversionData);

  // Example: Facebook Pixel
  // if (typeof fbq !== 'undefined') {
  //   fbq('track', 'Purchase', conversionData);
  // }
};

/**
 * Functional cookie helpers
 */
export const setUserPreference = (key: string, value: string): void => {
  if (isCookieAllowed("functional")) {
    setCookieWithConsent(`pref_${key}`, value, "functional", {
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    });
  }
};

export const getUserPreference = (key: string): string | null => {
  if (isCookieAllowed("functional")) {
    return getCookieValue(`pref_${key}`);
  }
  return null;
};
