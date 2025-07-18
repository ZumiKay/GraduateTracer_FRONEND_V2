import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { RootState } from "../redux/store";
import {
  setCookieConsent,
  setConsentPreferences,
  CookiePreferences,
} from "../redux/cookieConsent.store";
import {
  getCookieConsent,
  setCookieConsentToStorage,
  clearNonConsentedCookies,
  isCookieAllowed,
  trackEvent,
  trackConversion,
  setUserPreference,
  getUserPreference,
} from "../utils/cookieUtils";

export type CookieCategory =
  | "necessary"
  | "functional"
  | "analytics"
  | "marketing";

interface UseCookieConsentReturn {
  hasConsent: boolean;
  preferences: CookiePreferences;
  isAllowed: (category: CookieCategory) => boolean;
  grantConsent: (preferences: CookiePreferences) => void;
  revokeConsent: () => void;
  updatePreferences: (preferences: CookiePreferences) => void;
  trackEvent: (eventName: string, eventData?: object) => void;
  trackConversion: (conversionData?: object) => void;
  setUserPreference: (key: string, value: string) => void;
  getUserPreference: (key: string) => string | null;
}

/**
 * Hook for managing cookie consent and preferences
 */
export const useCookieConsent = (): UseCookieConsentReturn => {
  const dispatch = useDispatch();
  const { hasConsent, preferences } = useSelector(
    (state: RootState) => state.cookieConsent
  );

  // Initialize consent state from localStorage on mount
  useEffect(() => {
    const consentData = getCookieConsent();
    if (consentData) {
      dispatch(setCookieConsent(consentData.hasConsent));
      dispatch(setConsentPreferences(consentData.preferences));
    }
  }, [dispatch]);

  // Clean up non-consented cookies when preferences change
  useEffect(() => {
    if (hasConsent) {
      clearNonConsentedCookies();
    }
  }, [hasConsent, preferences]);

  const isAllowed = (category: CookieCategory): boolean => {
    return isCookieAllowed(category);
  };

  const grantConsent = (newPreferences: CookiePreferences): void => {
    dispatch(setCookieConsent(true));
    dispatch(setConsentPreferences(newPreferences));
    setCookieConsentToStorage(true, newPreferences);
  };

  const revokeConsent = (): void => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };

    dispatch(setCookieConsent(false));
    dispatch(setConsentPreferences(onlyNecessary));
    setCookieConsentToStorage(false, onlyNecessary);
    clearNonConsentedCookies();
  };

  const updatePreferences = (newPreferences: CookiePreferences): void => {
    dispatch(setConsentPreferences(newPreferences));
    setCookieConsentToStorage(hasConsent, newPreferences);
  };

  return {
    hasConsent,
    preferences,
    isAllowed,
    grantConsent,
    revokeConsent,
    updatePreferences,
    trackEvent,
    trackConversion,
    setUserPreference,
    getUserPreference,
  };
};

/**
 * Hook for analytics tracking with consent check
 */
export const useAnalytics = () => {
  const { isAllowed } = useCookieConsent();

  const track = (eventName: string, eventData?: object): void => {
    if (isAllowed("analytics")) {
      trackEvent(eventName, eventData);
    }
  };

  const trackPageView = (pageName: string, additionalData?: object): void => {
    track("page_view", {
      page: pageName,
      timestamp: new Date().toISOString(),
      ...additionalData,
    });
  };

  const trackUserAction = (
    action: string,
    target?: string,
    value?: string
  ): void => {
    track("user_action", {
      action,
      target,
      value,
      timestamp: new Date().toISOString(),
    });
  };

  const trackFormSubmission = (formId: string, formType: string): void => {
    track("form_submission", {
      form_id: formId,
      form_type: formType,
      timestamp: new Date().toISOString(),
    });
  };

  return {
    track,
    trackPageView,
    trackUserAction,
    trackFormSubmission,
    isAnalyticsAllowed: isAllowed("analytics"),
  };
};

/**
 * Hook for marketing tracking with consent check
 */
export const useMarketing = () => {
  const { isAllowed } = useCookieConsent();

  const trackConversionEvent = (conversionData?: object): void => {
    if (isAllowed("marketing")) {
      trackConversion(conversionData);
    }
  };

  const trackPurchase = (purchaseData: {
    value: number;
    currency: string;
    transactionId: string;
    items?: Array<{ name: string; value: number }>;
  }): void => {
    trackConversionEvent({
      event_type: "purchase",
      ...purchaseData,
    });
  };

  const trackSignup = (signupData?: object): void => {
    trackConversionEvent({
      event_type: "signup",
      timestamp: new Date().toISOString(),
      ...signupData,
    });
  };

  return {
    trackConversionEvent,
    trackPurchase,
    trackSignup,
    isMarketingAllowed: isAllowed("marketing"),
  };
};

/**
 * Hook for functional preferences with consent check
 */
export const useUserPreferences = () => {
  const { isAllowed } = useCookieConsent();

  const setPreference = (key: string, value: string): void => {
    if (isAllowed("functional")) {
      setUserPreference(key, value);
    }
  };

  const getPreference = (key: string): string | null => {
    if (isAllowed("functional")) {
      return getUserPreference(key);
    }
    return null;
  };

  const setTheme = (theme: "light" | "dark"): void => {
    setPreference("theme", theme);
  };

  const getTheme = (): "light" | "dark" | null => {
    return getPreference("theme") as "light" | "dark" | null;
  };

  const setLanguage = (language: string): void => {
    setPreference("language", language);
  };

  const getLanguage = (): string | null => {
    return getPreference("language");
  };

  return {
    setPreference,
    getPreference,
    setTheme,
    getTheme,
    setLanguage,
    getLanguage,
    isFunctionalAllowed: isAllowed("functional"),
  };
};
