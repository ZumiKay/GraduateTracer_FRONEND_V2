// Constants for storage keys - used across auth flow
const PENDING_REDIRECT_KEY = "pendingRedirectUrl";

/**
 * Store a URL to redirect to after authentication
 * @param url - The full URL path including search params
 */
export const setPendingRedirect = (url: string) => {
  sessionStorage.setItem(PENDING_REDIRECT_KEY, url);
};

/**
 * Get the stored redirect URL
 * @returns The stored URL or null if none exists
 */
export const getPendingRedirect = (): string | null => {
  return sessionStorage.getItem(PENDING_REDIRECT_KEY);
};

/**
 * Clear the stored redirect URL
 */
export const clearPendingRedirect = () => {
  sessionStorage.removeItem(PENDING_REDIRECT_KEY);
};

/**
 * Check if there's a pending redirect
 * @returns true if a redirect URL is stored
 */
export const hasPendingRedirect = (): boolean => {
  return sessionStorage.getItem(PENDING_REDIRECT_KEY) !== null;
};
