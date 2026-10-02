import { ROLE } from "../types/User.types";

export const USER_SESSION_STORAGE_KEY = "graduate_user_session";

export interface StoredUserSession {
  user: {
    _id: string;
    name: string;
    email: string;
    role: ROLE;
  } | null;
  isAuthenticated: boolean;
  expiresAt?: string;
}

export const getStoredUserSession = (): StoredUserSession | null => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = localStorage.getItem(USER_SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setStoredUserSession = (session: StoredUserSession) => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    if (!session.isAuthenticated || !session.user) {
      localStorage.removeItem(USER_SESSION_STORAGE_KEY);
    } else {
      localStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  } catch {}
};

export const clearStoredUserSession = () => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    localStorage.removeItem(USER_SESSION_STORAGE_KEY);
  } catch {}
};

/**
 * Checks if a session currently exists in frontend state and is expired.
 * Returns true ONLY if an authenticated session exists with an expiresAt in the past.
 */
export const isStoredSessionExpired = (): boolean => {
  const session = getStoredUserSession();
  if (!session || !session.user || !session.expiresAt) {
    return false;
  }
  const expiry = new Date(session.expiresAt).getTime();
  if (isNaN(expiry)) return false;
  return Date.now() >= expiry;
};

/**
 * Returns true if an active, authenticated session exists in frontend state.
 */
export const hasExistingActiveSession = (): boolean => {
  const session = getStoredUserSession();
  return Boolean(session?.isAuthenticated && session?.user);
};
