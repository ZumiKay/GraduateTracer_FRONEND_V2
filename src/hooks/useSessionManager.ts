import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { generateStorageKey, getGuestData, saveGuestData } from "../helperFunc";
import { RespondentSessionType } from "../component/Response/Response.type";
import { ErrorToast } from "../component/Modal/AlertModal";
import { accessModeType } from "../component/Response/hooks/usePaginatedFormData";
import { GuestData } from "../types/PublicFormAccess.types";

interface UseSessionManagerProps {
  formId?: string;
  accessMode: accessModeType;
  isFormRequiredSessionChecked: boolean;
  formsession?: Partial<RespondentSessionType>;
  setformsession: React.Dispatch<
    React.SetStateAction<Partial<RespondentSessionType> | undefined>
  >;
  onAutoSignOut?: () => Promise<void>;
}

const INACTIVITY_WARNING_TIMEOUT = 5 * 1000; // 5 seconds (for testing)
const AUTO_SIGNOUT_TIMEOUT = 60 * 60 * 1000; // 60 minutes
const PAGE_VISIBILITY_ALERT_THRESHOLD = 5 * 1000; // 5 minutes
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keypress",
  "scroll",
  "touchstart",
  "click",
] as const;

export const useSessionManager = ({
  formId,
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

  // Generate storage key for guest mode
  const storageKey = useMemo(() => {
    if (accessMode === "guest" && formId) {
      return generateStorageKey({ suffix: "session", formId });
    }
    return null;
  }, [accessMode, formId]);

  // Get storage data helper functions
  const getLocalStorageData = useCallback(() => {
    if (accessMode === "guest") {
      return getGuestData();
    }
    return null;
  }, [accessMode]);

  const saveLoginStateToStorage = useCallback(
    (sessionData: Partial<RespondentSessionType>) => {
      if (accessMode === "guest" && sessionData) {
        // Convert session data to GuestData format
        const guestData: GuestData = {
          name: sessionData.respondentinfo?.name || "Guest",
          isActive: sessionData.isActive || false,
          timeStamp: Date.now(),
          sessionId: sessionData.session_id,
        };
        saveGuestData(guestData, storageKey || undefined);
      }
    },
    [accessMode, storageKey]
  );

  // Reset activity timer and update session state
  const resetActivityTimer = useCallback(() => {
    if (!isMountedRef.current) return;

    const now = new Date();
    setLastActivityTime(now);
    lastActivityTimeRef.current = now;

    // Clear existing timers
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    if (autoSignoutTimeoutRef.current) {
      clearTimeout(autoSignoutTimeoutRef.current);
    }

    // Reset warning and inactive states
    setShowWarning(false);
    setUserInactive(false);

    // Update formsession to active state if it exists
    if (formsession) {
      setformsession((prev) => ({
        ...prev,
        isActive: true,
      }));
    }

    // Set new inactivity warning timer
    activityTimeoutRef.current = setTimeout(() => {
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
      autoSignoutTimeoutRef.current = setTimeout(async () => {
        if (!isMountedRef.current) return;

        console.log("🚪 Auto signout due to inactivity");
        try {
          if (onAutoSignOut) {
            await onAutoSignOut();
          }
        } catch (error) {
          console.error("Error during auto signout:", error);
        }
      }, AUTO_SIGNOUT_TIMEOUT - INACTIVITY_WARNING_TIMEOUT);
    }, INACTIVITY_WARNING_TIMEOUT);
  }, [formsession, setformsession, onAutoSignOut]);

  // Activity event handler
  const handleActivity = useCallback(() => {
    if (!isMountedRef.current) return;
    resetActivityTimer();
  }, [resetActivityTimer]);

  // Helper function to reactivate session (alias for resetActivityTimer)
  const handleReactivateSession = useCallback(() => {
    resetActivityTimer();
  }, [resetActivityTimer]);

  // Initialize timer when form loads - FIXED: Prevent infinite loop
  useEffect(() => {
    if (
      ((accessMode === "authenticated" && isFormRequiredSessionChecked) ||
        accessMode === "guest") &&
      !activityTimeoutRef.current
    ) {
      console.log(`🚀 Initialize timer for ${accessMode}`);
      // Use setTimeout to break dependency cycle and prevent infinite loop
      setTimeout(() => {
        if (isMountedRef.current) {
          resetActivityTimer();
        }
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessMode, isFormRequiredSessionChecked]); // Intentionally not including resetActivityTimer

  // Setup activity event listeners
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

  // Page visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isMountedRef.current) return;

      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);

      if (isVisible) {
        setAlertDismissed(false);
        resetActivityTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [resetActivityTimer]);

  // Show page visibility alert
  useEffect(() => {
    if (!isPageVisible && !alertDismissed) {
      const timer = setTimeout(() => {
        if (!isMountedRef.current || isPageVisible || alertDismissed) return;

        ErrorToast({
          title: "Page Not Visible",
          content: "Please keep this page visible to maintain your session.",
        });
        setAlertDismissed(true);
      }, PAGE_VISIBILITY_ALERT_THRESHOLD);

      return () => clearTimeout(timer);
    }
  }, [isPageVisible, alertDismissed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      if (autoSignoutTimeoutRef.current) {
        clearTimeout(autoSignoutTimeoutRef.current);
      }
    };
  }, []);

  return {
    userInactive,
    showWarning,
    lastActivityTime,
    isPageVisible,
    getLocalStorageData,
    saveLoginStateToStorage,
    resetActivityTimer,
    storageKey,
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
