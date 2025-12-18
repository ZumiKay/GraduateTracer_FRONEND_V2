import { useState, useEffect, useRef, useCallback } from "react";
import { RespondentSessionType } from "../component/Response/Response.type";
import { ErrorToast } from "../component/Modal/AlertModal";
import { accessModeType } from "../component/Response/hooks/usePaginatedFormData";

interface UseSessionManagerProps {
  accessMode: accessModeType;
  isFormRequiredSessionChecked: boolean;
  formsession?: Partial<RespondentSessionType>;
  setformsession: React.Dispatch<
    React.SetStateAction<Partial<RespondentSessionType> | undefined>
  >;
  onAutoSignOut?: () => Promise<void>;
}

const INACTIVITY_WARNING_TIMEOUT = 10 * 60 * 1000; // 10 minute
const AUTO_SIGNOUT_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const PAGE_VISIBILITY_ALERT_THRESHOLD = 5 * 60 * 1000; // 5 minutes
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keypress",
  "scroll",
  "touchstart",
  "click",
] as const;

export const useSessionManager = ({
  accessMode,
  isFormRequiredSessionChecked,
  formsession,
  setformsession,
  onAutoSignOut,
}: UseSessionManagerProps) => {
  // Core state
  const [userInactive, setUserInactive] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState<Date>(new Date());
  const [isPageVisible, setIsPageVisible] = useState<boolean>(true);
  const [alertDismissed, setAlertDismissed] = useState<boolean>(false);

  // Refs for persistence
  const activityTimeoutRef = useRef<number | null>(null);
  const autoSignoutTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const lastActivityTimeRef = useRef<Date>(new Date());
  const lastResetTimeRef = useRef<number>(0);

  // Reset activity timer and clear any existing timers - optimized with throttling
  const resetActivityTimer = useCallback(() => {
    if (!isMountedRef.current) return;

    // Throttle: Only reset if at least 1 second has passed since last reset
    const currentTime = Date.now();
    const timeSinceLastReset = currentTime - lastResetTimeRef.current;
    if (timeSinceLastReset < 1000) {
      return; // Skip if called too frequently
    }
    lastResetTimeRef.current = currentTime;

    console.log("🔄 Activity detected - resetting timer");

    // Clear existing timers
    if (activityTimeoutRef.current !== null) {
      clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = null;
    }
    if (autoSignoutTimeoutRef.current !== null) {
      clearTimeout(autoSignoutTimeoutRef.current);
      autoSignoutTimeoutRef.current = null;
    }

    // Update last activity time
    const activityDate = new Date();
    setLastActivityTime(activityDate);
    lastActivityTimeRef.current = activityDate;

    // Set new inactivity warning timer
    activityTimeoutRef.current = window.setTimeout(() => {
      if (!isMountedRef.current) return;

      console.log("⚠️ User inactive - showing warning");
      setUserInactive(true);
      setShowWarning(true);

      // Update formsession to inactive state
      setformsession((prev) => ({
        ...prev,
        isActive: false,
      }));

      // Set auto signout timer
      autoSignoutTimeoutRef.current = window.setTimeout(async () => {
        if (!isMountedRef.current) return;

        console.log("🚪 Auto signout due to inactivity");
        try {
          // Use callback directly from closure - it's stable
          if (onAutoSignOut) {
            await onAutoSignOut();
          }
        } catch (error) {
          console.error("Error during auto signout:", error);
        }
      }, AUTO_SIGNOUT_TIMEOUT - INACTIVITY_WARNING_TIMEOUT);
    }, INACTIVITY_WARNING_TIMEOUT);
  }, [setformsession, onAutoSignOut]);

  // Use ref for activity handler to avoid recreating listeners
  const resetActivityTimerRef = useRef(resetActivityTimer);

  // Keep ref updated
  useEffect(() => {
    resetActivityTimerRef.current = resetActivityTimer;
  }, [resetActivityTimer]);

  // Activity event handler - stable reference using ref
  const handleActivity = useCallback(() => {
    if (!isMountedRef.current) return;
    resetActivityTimerRef.current();
  }, []);

  // Helper function to reactivate session
  const handleReactivateSession = useCallback(() => {
    console.log("🔄 Reactivating session...");

    // Reset the throttle timestamp to allow immediate reset
    lastResetTimeRef.current = 0;

    // Clear existing timers
    if (activityTimeoutRef.current !== null) {
      clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = null;
    }
    if (autoSignoutTimeoutRef.current !== null) {
      clearTimeout(autoSignoutTimeoutRef.current);
      autoSignoutTimeoutRef.current = null;
    }

    // Reset all state
    setUserInactive(false);
    setShowWarning(false);
    setformsession((prev) => ({
      ...prev,
      isActive: true,
    }));

    // Now reset the activity timer
    resetActivityTimerRef.current();

    console.log("✅ Session reactivated successfully");
  }, [setformsession]);

  // Initialize timer when form loads - optimized with ref
  useEffect(() => {
    if (
      (accessMode === "authenticated" && isFormRequiredSessionChecked) ||
      accessMode === "guest"
    ) {
      console.log(`🚀 Initialize timer for ${accessMode}`);
      // Reset throttle on initialization to allow immediate execution
      lastResetTimeRef.current = 0;
      resetActivityTimerRef.current();
    }
    return () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      if (autoSignoutTimeoutRef.current) {
        clearTimeout(autoSignoutTimeoutRef.current);
      }
    };
  }, [accessMode, isFormRequiredSessionChecked]);

  // Event listeners
  useEffect(() => {
    if (
      (accessMode === "authenticated" && isFormRequiredSessionChecked) ||
      accessMode === "guest"
    ) {
      ACTIVITY_EVENTS.forEach((event) => {
        document.addEventListener(event, handleActivity, { passive: true });
      });

      return () => {
        ACTIVITY_EVENTS.forEach((event) => {
          document.removeEventListener(event, handleActivity);
        });
      };
    }
  }, [accessMode, isFormRequiredSessionChecked, handleActivity]);

  // Visibility change handler - optimized with ref
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isMountedRef.current) return;

      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);

      if (isVisible) {
        setAlertDismissed(false);
        resetActivityTimerRef.current();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []); // No dependencies needed - all stable

  // Show page visibility alert
  useEffect(() => {
    if (!isPageVisible && !alertDismissed) {
      const timer = setTimeout(() => {
        if (!isMountedRef.current || isPageVisible || alertDismissed) return;

        ErrorToast({
          toastid: "UniquePageVisibilityAlert",
          title: "Page Not Visible",
          content: "Please keep this page visible to maintain your session.",
        });
        setAlertDismissed(true);
      }, PAGE_VISIBILITY_ALERT_THRESHOLD);

      return () => clearTimeout(timer);
    }
  }, [isPageVisible, alertDismissed]);

  return {
    userInactive,
    showWarning,
    lastActivityTime,
    isPageVisible,
    resetActivityTimer,
    // Additional properties for InactivityWarning compatibility
    isSessionActive: !userInactive,
    timeUntilAutoSignout: AUTO_SIGNOUT_TIMEOUT - INACTIVITY_WARNING_TIMEOUT,
    warningMessage: userInactive
      ? "You will be automatically signed out due to inactivity."
      : "",
    showInactivityAlert: showWarning,
    debugInfo: {
      accessMode,
      formsessionActive: formsession?.isActive,
      isFormRequiredSessionChecked,
      lastActivity: lastActivityTime.toISOString(),
    },
    handleReactivateSession,
  };
};
