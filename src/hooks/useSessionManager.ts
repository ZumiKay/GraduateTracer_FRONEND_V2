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
  onAutoSignOut?: () => void;
}

const INACTIVITY_WARNING_TIMEOUT = 10 * 60 * 1000; // 10 minute
const AUTO_SIGNOUT_TIMEOUT = 30 * 60 * 1000; // 30 minutes
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
  accessMode,
  isFormRequiredSessionChecked,
  formsession,
  setformsession,
  onAutoSignOut,
}: UseSessionManagerProps) => {
  const [userInactive, setUserInactive] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState<Date>(new Date());
  const [isPageVisible, setIsPageVisible] = useState<boolean>(true);
  const [alertDismissed, setAlertDismissed] = useState<boolean>(false);
  const activityTimeoutRef = useRef<number | null>(null);
  const autoSignoutTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const lastActivityTimeRef = useRef<Date>(new Date());
  const lastResetTimeRef = useRef<number>(0);

  /**Track respondent activitiy with event */
  const resetActivityTimer = useCallback(() => {
    if (!isMountedRef.current) return;

    const currentTime = Date.now();
    const timeSinceLastReset = currentTime - lastResetTimeRef.current;
    if (timeSinceLastReset < 1000) {
      return; // Skip if called too frequently
    }
    lastResetTimeRef.current = currentTime;

    //Clear exists timer
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

        try {
          if (onAutoSignOut) {
            onAutoSignOut();
          }
        } catch (error) {
          console.error("Error during auto signout:", error);
        }
      }, AUTO_SIGNOUT_TIMEOUT - INACTIVITY_WARNING_TIMEOUT);
    }, INACTIVITY_WARNING_TIMEOUT);
  }, [setformsession, onAutoSignOut]);

  const handleReactivateSession = useCallback(() => {
    lastResetTimeRef.current = 0;

    if (activityTimeoutRef.current !== null) {
      clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = null;
    }
    if (autoSignoutTimeoutRef.current !== null) {
      clearTimeout(autoSignoutTimeoutRef.current);
      autoSignoutTimeoutRef.current = null;
    }

    setUserInactive(false);
    setShowWarning(false);
    setformsession((prev) => ({
      ...prev,
      isActive: true,
    }));

    //reset the activity timer
    resetActivityTimer();
  }, [resetActivityTimer, setformsession]);

  //Only enable acitivity timer when form required email
  useEffect(() => {
    if (accessMode === "authenticated" && isFormRequiredSessionChecked) {
      lastResetTimeRef.current = 0;
      resetActivityTimer();
    }
    return () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      if (autoSignoutTimeoutRef.current) {
        clearTimeout(autoSignoutTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessMode, isFormRequiredSessionChecked]);

  //Enable timer base on activity mode (click , scroll , etc ...)
  useEffect(() => {
    const handleActivity = () => {
      if (!isMountedRef.current) return;
      resetActivityTimer();
    };
    if (accessMode === "authenticated" && isFormRequiredSessionChecked) {
      ACTIVITY_EVENTS.forEach((event) => {
        document.addEventListener(event, handleActivity, { passive: true });
      });

      return () => {
        ACTIVITY_EVENTS.forEach((event) => {
          document.removeEventListener(event, handleActivity);
        });
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessMode, isFormRequiredSessionChecked]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isMountedRef.current) return;

      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);

      if (isVisible) {
        setAlertDismissed(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

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
