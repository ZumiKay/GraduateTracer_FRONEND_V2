import React, { createContext, useCallback, useRef, useEffect } from "react";
import { UseMutationResult } from "@tanstack/react-query";
import { ApiRequestReturnType } from "../hooks/APIHook/ApiHook";

interface SessionContextType {
  checkSession: () => Promise<boolean>;
  isChecking: boolean;
  lastCheckSuccess: boolean | null;
  onSessionExpired?: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

interface SessionProviderProps {
  children: React.ReactNode;
  manuallyCheckSession: UseMutationResult<
    ApiRequestReturnType,
    Error,
    void,
    unknown
  >;
  onSessionExpired?: () => void;
  periodicCheckInterval?: number;
  checkOnVisibilityChange?: boolean;
}

/**Sessiin provider wrapper
 * @description public form access session manangement
 * @method
 * - check for valid active session
 * - expand session
 * - onSessionExpired
 */
export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
  manuallyCheckSession,
  onSessionExpired,
  periodicCheckInterval = 0,
  checkOnVisibilityChange = true,
}) => {
  const lastCheckResultRef = useRef<boolean | null>(null);
  const lastCheckTimeRef = useRef<number>(0);
  const checkCooldownMs = 5000; // Minimum 5 seconds between checks

  const checkSession = useCallback(async (): Promise<boolean> => {
    // Throttle: prevent checking too frequently
    const now = Date.now();
    if (now - lastCheckTimeRef.current < checkCooldownMs) {
      console.log("🔄 [SessionContext] Session check throttled");
      return lastCheckResultRef.current ?? true;
    }

    try {
      lastCheckTimeRef.current = now;

      const result = await manuallyCheckSession.mutateAsync();

      if (result.success) {
        lastCheckResultRef.current = true;
        return true;
      } else {
        lastCheckResultRef.current = false;
        onSessionExpired?.();
        return false;
      }
    } catch (error) {
      console.log(error);
      lastCheckResultRef.current = false;
      onSessionExpired?.();
      return false;
    }
  }, [manuallyCheckSession, onSessionExpired]);

  // Periodic session check
  // useEffect(() => {
  //   // if (periodicCheckInterval <= 0) return;

  //   // const interval = setInterval(() => {
  //   //   checkSession();
  //   // }, periodicCheckInterval);

  //   // return () => clearInterval(interval);
  // }, [periodicCheckInterval, checkSession]);

  useEffect(() => {
    if (!checkOnVisibilityChange) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Only check if tab was hidden for more than 1 minute
        const hiddenDuration = Date.now() - lastCheckTimeRef.current;
        if (hiddenDuration > 60000) {
          checkSession();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [checkOnVisibilityChange, checkSession]);

  const value: SessionContextType = {
    checkSession,
    isChecking: manuallyCheckSession.isPending,
    lastCheckSuccess: lastCheckResultRef.current,
    onSessionExpired,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

export default SessionContext;
