import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { UseMutationResult } from "@tanstack/react-query";
import { ApiRequestReturnType } from "../hooks/ApiHook";

interface SessionContextType {
  // Manual session check function
  checkSession: () => Promise<boolean>;
  // Is session check in progress
  isChecking: boolean;
  // Last check result
  lastCheckSuccess: boolean | null;
  // Callback for session expired
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
  // Interval for periodic checks (in ms, 0 to disable)
  periodicCheckInterval?: number;
  // Enable visibility change check
  checkOnVisibilityChange?: boolean;
}

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
      console.log("🔍 [SessionContext] Checking session...");
      lastCheckTimeRef.current = now;

      const result = await manuallyCheckSession.mutateAsync();

      if (result.success) {
        console.log("✅ [SessionContext] Session is valid");
        lastCheckResultRef.current = true;
        return true;
      } else {
        console.log("❌ [SessionContext] Session is invalid");
        lastCheckResultRef.current = false;
        onSessionExpired?.();
        return false;
      }
    } catch (error) {
      console.error("❌ [SessionContext] Session check error:", error);
      lastCheckResultRef.current = false;
      onSessionExpired?.();
      return false;
    }
  }, [manuallyCheckSession, onSessionExpired]);

  // Periodic session check
  useEffect(() => {
    if (periodicCheckInterval <= 0) return;

    const interval = setInterval(() => {
      checkSession();
    }, periodicCheckInterval);

    return () => clearInterval(interval);
  }, [periodicCheckInterval, checkSession]);

  // Check session on visibility change (when user returns to tab)
  useEffect(() => {
    if (!checkOnVisibilityChange) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Only check if tab was hidden for more than 1 minute
        const hiddenDuration = Date.now() - lastCheckTimeRef.current;
        if (hiddenDuration > 60000) {
          console.log(
            "👁️ [SessionContext] Tab became visible, checking session..."
          );
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

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (!context) {
    // Return a dummy context if not within provider (for backward compatibility)
    return {
      checkSession: async () => true,
      isChecking: false,
      lastCheckSuccess: null,
      onSessionExpired: undefined,
    };
  }
  return context;
};

export default SessionContext;
