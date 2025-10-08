import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { extractStorageKeyComponents, generateStorageKey } from "../helperFunc";
import { RespondentSessionType } from "../component/Response/Response.type";
import { ErrorToast } from "../component/Modal/AlertModal";
import { accessModeType } from "../component/Response/hooks/usePaginatedFormData";
import useFormsessionAPI from "./useFormsessionAPI";

interface UseSessionManagerProps {
  formId?: string;
  userEmail?: string;
  accessMode: accessModeType;
  isFormRequiredSessionChecked: boolean;
  formsession?: Partial<RespondentSessionType>;
  setformsession: React.Dispatch<
    React.SetStateAction<Partial<RespondentSessionType> | undefined>
  >;
  onAutoSignOut?: () => Promise<void>; // Callback for automatic signout
}

const INACTIVITY_WARNING_TIMEOUT = 5 * 1000; // 5 seconds (for testing)
const AUTO_SIGNOUT_TIMEOUT = 60 * 60 * 1000; // 60 minutes
const PAGE_VISIBILITY_ALERT_THRESHOLD = 5 * 60 * 1000; // 5 minutes
const AWAY_NOTIFICATION_DELAY = 15 * 60 * 1000; // 15 minutes
const ALERT_AUTO_DISMISS_DELAY = 10000; // 10 seconds
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
  userEmail,
  accessMode,
  isFormRequiredSessionChecked,
  formsession,
  setformsession,
  onAutoSignOut,
}: UseSessionManagerProps) => {
  // Core state
  const [userInactive, setUserInactive] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Page visibility state - initialize more safely
  const [isPageVisible, setIsPageVisible] = useState(() => {
    try {
      return typeof document !== "undefined" ? !document.hidden : true;
    } catch {
      return true;
    }
  });
  const [timeAwayFromPage, setTimeAwayFromPage] = useState(0);
  const [showPageVisibilityAlert, setShowPageVisibilityAlert] = useState(false);

  // Refs for timers and tracking
  const activityTimeoutRef = useRef<number | null>(null);
  const autoSignoutTimeoutRef = useRef<number | null>(null);
  const pageVisibilityTimeRef = useRef<number | null>(null);
  const awayStartTimeRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const alertDismissTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // API hooks
  const { useSessionVerification } = useFormsessionAPI();
  const sessionVerification = useSessionVerification(
    {
      isActive: !!formId || accessMode !== "login",
    },
    userInactive,
    formId
  );

  const storageKey = useMemo(() => {
    if (!formId || !userEmail) return null;
    return generateStorageKey({
      suffix: "state",
      userKey: userEmail,
      formId,
    });
  }, [formId, userEmail]);

  // Cleanup function for all timers
  const clearAllTimers = useCallback(() => {
    const timers = [
      activityTimeoutRef.current,
      autoSignoutTimeoutRef.current,
      pageVisibilityTimeRef.current,
      alertDismissTimeoutRef.current,
    ];

    timers.forEach((timer) => {
      if (timer) clearTimeout(timer);
    });

    activityTimeoutRef.current = null;
    autoSignoutTimeoutRef.current = null;
    pageVisibilityTimeRef.current = null;
    alertDismissTimeoutRef.current = null;
  }, []);

  // Cleanup form progress storage
  const cleanupOtherFormProgress = useCallback(() => {
    if (!formId) return;

    try {
      const currentFormPrefix = `form_progress_${formId}`;
      const keysToRemove: string[] = [];

      // Iterate through localStorage to find form_progress keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (
          key &&
          key.startsWith("form_progress_") &&
          !key.startsWith(currentFormPrefix)
        ) {
          const extractedKey = extractStorageKeyComponents(key);
          if (
            extractedKey.suffix === "state" &&
            extractedKey.formId !== formId
          ) {
            keysToRemove.push(key);
          }
        }
      }

      // Remove the keys that don't belong to current form
      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      if (keysToRemove.length > 0) {
        console.log(
          `Cleaned up ${keysToRemove.length} form progress entries from other forms`
        );
      }
    } catch (error) {
      console.error("Failed to cleanup form progress storage:", error);
    }
  }, [formId]);

  useEffect(() => {
    isMountedRef.current = true;

    cleanupOtherFormProgress();

    return () => {
      isMountedRef.current = false;
      clearAllTimers();
    };
  }, [clearAllTimers, cleanupOtherFormProgress]);

  useEffect(() => {
    if (!formId || !isMountedRef.current) return;

    const verificationData = sessionVerification.data;
    if (!verificationData?.success && verificationData?.status === 401) {
      try {
        ErrorToast({
          toastid: "UniquesessionExpired",
          title: "Session expire",
          content: "Session expired",
        });

        //Should be auto signout
      } catch (error) {
        console.error("Session verification error:", error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, sessionVerification.data]);

  const getLocalStorageData = useCallback(() => {
    if (!storageKey) return null;

    try {
      const savedData = localStorage.getItem(storageKey);
      return savedData
        ? (JSON.parse(savedData) as RespondentSessionType)
        : null;
    } catch (error) {
      console.error("Failed to get localStorage data:", error);
      return null;
    }
  }, [storageKey]);

  const saveLoginStateToStorage = useCallback(
    (state: Partial<RespondentSessionType>) => {
      if (!storageKey) return;

      try {
        localStorage.setItem(storageKey, JSON.stringify({ ...state }));
      } catch (error) {
        console.error("Failed to save to localStorage:", error);
      }
    },
    [storageKey]
  );

  const removeLocalStorageState = useCallback(() => {
    if (getLocalStorageData() && storageKey) {
      window.localStorage.removeItem(storageKey);
    }
  }, [getLocalStorageData, storageKey]);

  const handleVisibilityChange = useCallback(() => {
    if (!isMountedRef.current) return;

    try {
      const isVisible =
        typeof document !== "undefined" ? !document.hidden : true;
      setIsPageVisible(isVisible);

      if (isVisible) {
        // User returned to page
        if (awayStartTimeRef.current) {
          const timeAway = Date.now() - awayStartTimeRef.current;
          setTimeAwayFromPage(timeAway);

          // Show alert if conditions are met
          if (
            timeAway > PAGE_VISIBILITY_ALERT_THRESHOLD &&
            accessMode === "authenticated" &&
            formsession?.isActive &&
            isMountedRef.current
          ) {
            setShowPageVisibilityAlert(true);

            // Auto-hide alert with cleanup
            alertDismissTimeoutRef.current = window.setTimeout(() => {
              if (isMountedRef.current) {
                setShowPageVisibilityAlert(false);
              }
            }, ALERT_AUTO_DISMISS_DELAY);
          }

          awayStartTimeRef.current = null;
        }

        // Clear the page visibility timer
        if (pageVisibilityTimeRef.current) {
          clearTimeout(pageVisibilityTimeRef.current);
          pageVisibilityTimeRef.current = null;
        }
      } else {
        // User left the page
        awayStartTimeRef.current = Date.now();

        // Set timer for notification
        pageVisibilityTimeRef.current = window.setTimeout(() => {
          if (!isMountedRef.current || typeof document === "undefined") return;
          if (!document.hidden) return; // User returned

          //Update localstorage state
          const prevStored = getLocalStorageData();
          saveLoginStateToStorage({ ...(prevStored ?? {}), isActive: false });

          // Show notification if available
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              new Notification("Session Alert", {
                body: "You have been away from the form. Your session may expire soon.",
                requireInteraction: true,
                icon: "/favicon.ico",
              });
            } catch (error) {
              console.warn("Failed to show notification:", error);
            }
          }
        }, AWAY_NOTIFICATION_DELAY);
      }
    } catch (error) {
      console.error("Page visibility change error:", error);
    }
  }, [
    accessMode,
    formsession?.isActive,
    getLocalStorageData,
    saveLoginStateToStorage,
  ]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.log("Notification permission request failed:", error);
      }
    }
  }, []);

  // Dismiss page visibility alert
  const dismissPageVisibilityAlert = useCallback(() => {
    setShowPageVisibilityAlert(false);
  }, []);

  const resetActivityTimer = useCallback(() => {
    if (!isMountedRef.current) return;

    lastActivityRef.current = Date.now();

    // Clear existing timers safely
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = null;
    }
    if (autoSignoutTimeoutRef.current) {
      clearTimeout(autoSignoutTimeoutRef.current);
      autoSignoutTimeoutRef.current = null;
    }

    // Only set timers if conditions are met
    if (
      accessMode === "authenticated" &&
      isFormRequiredSessionChecked &&
      formsession?.isActive &&
      isMountedRef.current
    ) {
      // Set 30-minute warning timer
      activityTimeoutRef.current = window.setTimeout(() => {
        if (!isMountedRef.current) return;

        try {
          setShowWarning(true);
          setUserInactive(true);

          //Update form session state
          const userStored = getLocalStorageData();

          saveLoginStateToStorage({ ...(userStored ?? {}), isActive: false });

          setformsession((prev) => ({
            ...prev,
            isActive: false,
            alert: true,
          }));
        } catch (error) {
          console.error("Warning timer error:", error);
        }
      }, INACTIVITY_WARNING_TIMEOUT);

      // Set 60-minute auto signout timer
      autoSignoutTimeoutRef.current = window.setTimeout(async () => {
        if (!isMountedRef.current) return;

        try {
          if (onAutoSignOut) {
            await onAutoSignOut();
          }
        } catch (error) {
          console.error("Auto signout failed:", error);
          if (isMountedRef.current) {
            ErrorToast({
              title: "Session Expired",
              content:
                "You have been automatically signed out due to inactivity.",
            });
          }
        } finally {
          if (isMountedRef.current) {
            // Clean up storage
            if (storageKey) {
              try {
                localStorage.removeItem(storageKey);
              } catch (error) {
                console.error("Failed to remove localStorage item:", error);
              }
            }

            setUserInactive(true);
            setShowWarning(false);
            setformsession({ isActive: false });
          }
        }
      }, AUTO_SIGNOUT_TIMEOUT);
    }
  }, [
    accessMode,
    isFormRequiredSessionChecked,
    formsession?.isActive,
    getLocalStorageData,
    saveLoginStateToStorage,
    setformsession,
    onAutoSignOut,
    storageKey,
  ]);

  // Throttled user activity handler for better performance
  const handleUserActivity = useCallback(() => {
    const now = Date.now();

    // Throttle activity detection to prevent excessive calls (500ms throttle)
    if (now - lastActivityRef.current < 500) return;

    if (
      accessMode === "authenticated" &&
      (formsession?.isActive || showWarning) &&
      !userInactive &&
      isMountedRef.current
    ) {
      resetActivityTimer();
    }
  }, [
    accessMode,
    formsession?.isActive,
    showWarning,
    userInactive,
    resetActivityTimer,
  ]);

  // Activity tracking effect
  useEffect(() => {
    if (
      accessMode === "authenticated" &&
      isFormRequiredSessionChecked &&
      formsession?.isActive &&
      !userInactive &&
      isMountedRef.current
    ) {
      // Add event listeners with passive option for better performance
      ACTIVITY_EVENTS.forEach((event) => {
        document.addEventListener(event, handleUserActivity, {
          passive: true,
          capture: false,
        });
      });

      resetActivityTimer();

      return () => {
        // Clean up event listeners
        ACTIVITY_EVENTS.forEach((event) => {
          document.removeEventListener(event, handleUserActivity);
        });

        // Clean up timers
        if (activityTimeoutRef.current) {
          clearTimeout(activityTimeoutRef.current);
          activityTimeoutRef.current = null;
        }
        if (autoSignoutTimeoutRef.current) {
          clearTimeout(autoSignoutTimeoutRef.current);
          autoSignoutTimeoutRef.current = null;
        }
      };
    }
  }, [
    accessMode,
    isFormRequiredSessionChecked,
    formsession?.isActive,
    userInactive,
    handleUserActivity,
    resetActivityTimer,
  ]);

  // Page visibility tracking effect
  useEffect(() => {
    if (
      accessMode === "authenticated" &&
      formsession?.isActive &&
      isMountedRef.current
    ) {
      document.addEventListener("visibilitychange", handleVisibilityChange, {
        passive: true,
      });

      // Request notification permission when session starts
      requestNotificationPermission();

      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        if (pageVisibilityTimeRef.current) {
          clearTimeout(pageVisibilityTimeRef.current);
          pageVisibilityTimeRef.current = null;
        }
      };
    }
  }, [
    accessMode,
    formsession?.isActive,
    handleVisibilityChange,
    requestNotificationPermission,
  ]);

  const handleReactivateSession = useCallback(async () => {
    if (!formId || !userEmail || !isMountedRef.current) return;

    try {
      const prevSavedData = getLocalStorageData();
      const sessionData = { ...prevSavedData, isActive: true };
      saveLoginStateToStorage(sessionData);

      if (isMountedRef.current) {
        setformsession(sessionData);
        setUserInactive(false);
        setShowWarning(false);
        resetActivityTimer();
      }
    } catch (error) {
      console.error("Session reactivation error:", error);
    }
  }, [
    formId,
    userEmail,
    getLocalStorageData,
    saveLoginStateToStorage,
    setformsession,
    resetActivityTimer,
  ]);

  // Memoized return object for better performance
  return useMemo(
    () => ({
      userInactive,
      showWarning,
      saveLoginStateToStorage,
      handleReactivateSession,
      showInactivityAlert: userInactive && formsession?.alert,
      timeUntilAutoSignout: showWarning
        ? AUTO_SIGNOUT_TIMEOUT - INACTIVITY_WARNING_TIMEOUT
        : null,
      // Page visibility states
      isPageVisible,
      timeAwayFromPage,
      showPageVisibilityAlert,
      dismissPageVisibilityAlert,
      requestNotificationPermission,
      removeLocalStorageState,
    }),
    [
      userInactive,
      showWarning,
      saveLoginStateToStorage,
      handleReactivateSession,
      formsession?.alert,
      isPageVisible,
      timeAwayFromPage,
      showPageVisibilityAlert,
      dismissPageVisibilityAlert,
      requestNotificationPermission,
      removeLocalStorageState,
    ]
  );
};
