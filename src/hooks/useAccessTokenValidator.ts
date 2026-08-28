import { useCallback, useMemo } from "react";

export interface AccessTokenValidationResult {
  isValid: boolean;
  isExpired: boolean;
  timeRemainingMs: number;
}

/**
 * Validates session access token expiry client-side without making server requests.
 * Uses the session `expiresAt` timestamp stored during login or initial session verification.
 */
export const isSessionTokenValid = (
  expiresAt?: string | Date | null,
): boolean => {
  if (!expiresAt) return false;
  const expiryTime = new Date(expiresAt).getTime();
  if (isNaN(expiryTime)) return false;
  return expiryTime > Date.now();
};

export const getSessionTimeRemaining = (
  expiresAt?: string | Date | null,
): number => {
  if (!expiresAt) return 0;
  const expiryTime = new Date(expiresAt).getTime();
  if (isNaN(expiryTime)) return 0;
  return Math.max(0, expiryTime - Date.now());
};

export const useAccessTokenValidator = (expiresAt?: string | Date | null) => {
  const validateSession = useCallback((): AccessTokenValidationResult => {
    if (!expiresAt) {
      return {
        isValid: false,
        isExpired: true,
        timeRemainingMs: 0,
      };
    }

    const expiryTime = new Date(expiresAt).getTime();
    if (isNaN(expiryTime)) {
      return {
        isValid: false,
        isExpired: true,
        timeRemainingMs: 0,
      };
    }

    const remaining = expiryTime - Date.now();
    const isValid = remaining > 0;

    return {
      isValid,
      isExpired: !isValid,
      timeRemainingMs: Math.max(0, remaining),
    };
  }, [expiresAt]);

  const validationState = useMemo(
    () => validateSession(),
    [validateSession],
  );

  return {
    ...validationState,
    validateSession,
  };
};

export default useAccessTokenValidator;
