

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



