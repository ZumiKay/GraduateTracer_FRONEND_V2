// Cookie consent related types

export type CookieCategory =
  | "necessary"
  | "functional"
  | "analytics"
  | "marketing";

export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsentState {
  hasConsent: boolean;
  preferences: CookiePreferences;
}

export interface CookieConsentData {
  hasConsent: boolean;
  preferences: CookiePreferences;
  timestamp: number;
}

export interface CookieConsentProps {
  className?: string;
  position?: "bottom" | "top" | "bottom-left" | "bottom-right";
  companyName?: string;
  privacyPolicyUrl?: string;
}

export interface CookieSettingsButtonProps {
  variant?:
    | "solid"
    | "bordered"
    | "light"
    | "flat"
    | "faded"
    | "shadow"
    | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export interface CookieOptions {
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
}

export interface AnalyticsEvent {
  eventName: string;
  eventData?: Record<string, unknown>;
  timestamp?: string;
}

export interface MarketingEvent {
  event_type: string;
  value?: number;
  currency?: string;
  [key: string]: unknown;
}

export interface UserPreference {
  key: string;
  value: string;
  category: CookieCategory;
}

// Extend the global Window interface for analytics and marketing scripts
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    // Add other global scripts as needed
  }
}

export {};
