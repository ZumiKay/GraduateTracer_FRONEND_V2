import React, { createContext, useCallback, useRef, useEffect } from "react";
import { UseMutationResult } from "@tanstack/react-query";
import { ApiRequestReturnType } from "../hooks/APIHook/ApiHook";
import { isSessionTokenValid } from "../hooks/useAccessTokenValidator";

export interface SessionContextType {
  checkSession: (forceServerCheck?: boolean) => Promise<boolean>;
  isChecking: boolean;
  lastCheckSuccess: boolean | null;
  onSessionExpired?: () => void;
}

export const SessionContext = createContext<SessionContextType | null>(null);

interface SessionProviderProps {
  children: React.ReactNode;
  manuallyCheckSession?: UseMutationResult<
    ApiRequestReturnType,
    Error,
    void,
    unknown
  >;
  expiresAt?: string | Date | null;
  onSessionExpired?: () => void;
  periodicCheckInterval?: number;
  checkOnVisibilityChange?: boolean;
}

/**
 * Session provider wrapper
 * @description Public form access session management with client-side access token validation
 */
export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
  manuallyCheckSession,
  expiresAt,
  onSessionExpired,
  checkOnVisibilityChange = true,
}) => {
  const lastCheckResultRef = useRef<boolean | null>(null);
  const lastCheckTimeRef = useRef<number>(0);
  const checkCooldownMs = 5000; // Minimum 5 seconds between checks

  const checkSession = useCallback(
    async (forceServerCheck = false): Promise<boolean> => {
      const now = Date.now();
      if (!forceServerCheck && now - lastCheckTimeRef.current < checkCooldownMs) {
        return lastCheckResultRef.current ?? true;
      }

      lastCheckTimeRef.current = now;

      // First validate token locally on frontend to cut down unnecessary server calls
      if (expiresAt !== undefined && expiresAt !== null) {
        const isValidLocally = isSessionTokenValid(expiresAt);
        if (!isValidLocally) {
          lastCheckResultRef.current = false;
          onSessionExpired?.();
          return false;
        }

        // Token is valid locally - skip server call unless explicitly forced
        if (!forceServerCheck) {
          lastCheckResultRef.current = true;
          return true;
        }
      }

      // Fallback or forced server check
      if (!manuallyCheckSession) {
        return lastCheckResultRef.current ?? true;
      }

      try {
        const result = await manuallyCheckSession.mutateAsync();
        if (result?.success) {
          lastCheckResultRef.current = true;
          return true;
        } else {
          lastCheckResultRef.current = false;
          onSessionExpired?.();
          return false;
        }
      } catch {
        lastCheckResultRef.current = false;
        onSessionExpired?.();
        return false;
      }
    },
    [expiresAt, manuallyCheckSession, onSessionExpired],
  );

  // Global listener for server-side session deletion/invalidation (e.g. 401 response from any endpoint)
  useEffect(() => {
    const handleGlobalSessionExpired = () => {
      lastCheckResultRef.current = false;
      onSessionExpired?.();
    };

    window.addEventListener("app:session-expired", handleGlobalSessionExpired);
    return () => {
      window.removeEventListener("app:session-expired", handleGlobalSessionExpired);
    };
  }, [onSessionExpired]);

  // Check session on visibility change (tab refocus) using client-side validation first
  useEffect(() => {
    if (!checkOnVisibilityChange) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const hiddenDuration = Date.now() - lastCheckTimeRef.current;
        if (hiddenDuration > 60000) {
          checkSession(false);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [checkOnVisibilityChange, checkSession]);

  const value: SessionContextType = {
    checkSession,
    isChecking: manuallyCheckSession?.isPending ?? false,
    lastCheckSuccess: lastCheckResultRef.current,
    onSessionExpired,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

export default SessionContext;
