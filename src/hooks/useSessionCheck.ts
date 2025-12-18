import { useCallback, useRef } from "react";
import { UseMutationResult } from "@tanstack/react-query";
import { ApiRequestReturnType } from "./ApiHook";

interface UseSessionCheckProps {
  manuallyCheckSession?: UseMutationResult<
    ApiRequestReturnType,
    Error,
    void,
    unknown
  >;
  onSessionExpired?: () => void;
  cooldownMs?: number;
}

/**
 * Hook to check session validity with throttling
 * Can be used directly without SessionContext for simpler use cases
 */
export const useSessionCheck = ({
  manuallyCheckSession,
  onSessionExpired,
  cooldownMs = 5000,
}: UseSessionCheckProps) => {
  const lastCheckTimeRef = useRef<number>(0);
  const lastResultRef = useRef<boolean | null>(null);

  const checkSession = useCallback(async (): Promise<boolean> => {
    if (!manuallyCheckSession) {
      return true; // No session check configured, assume valid
    }

    // Throttle: prevent checking too frequently
    const now = Date.now();
    if (now - lastCheckTimeRef.current < cooldownMs) {
      console.log("🔄 [useSessionCheck] Session check throttled");
      return lastResultRef.current ?? true;
    }

    try {
      console.log("🔍 [useSessionCheck] Checking session...");
      lastCheckTimeRef.current = now;

      const result = await manuallyCheckSession.mutateAsync();

      if (result.success) {
        console.log("✅ [useSessionCheck] Session is valid");
        lastResultRef.current = true;
        return true;
      } else {
        console.log("❌ [useSessionCheck] Session is invalid");
        lastResultRef.current = false;
        onSessionExpired?.();
        return false;
      }
    } catch (error) {
      console.error("❌ [useSessionCheck] Session check error:", error);
      lastResultRef.current = false;
      onSessionExpired?.();
      return false;
    }
  }, [manuallyCheckSession, onSessionExpired, cooldownMs]);

  /**
   * Wrapper function that checks session before executing an action
   * Returns true if action was executed, false if blocked due to invalid session
   */
  const withSessionCheck = useCallback(
    async (action: () => void | Promise<void>): Promise<boolean> => {
      const isValid = await checkSession();
      if (isValid) {
        await action();
        return true;
      }
      return false;
    },
    [checkSession]
  );

  return {
    checkSession,
    withSessionCheck,
    isChecking: manuallyCheckSession?.isPending ?? false,
    lastCheckSuccess: lastResultRef.current,
  };
};

export default useSessionCheck;
