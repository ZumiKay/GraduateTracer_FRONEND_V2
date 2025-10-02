import { useState, useEffect, useRef, useCallback } from "react";
import { generateStorageKey } from "../helperFunc";
import { RespondentSessionType } from "../component/Response/Response.type";
import { useRenewFormSession } from "./usePublicFormAccess";
import { ErrorToast } from "../component/Modal/AlertModal";
import { accessModeType } from "../component/Response/hooks/usePaginatedFormData";

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

const INACTIVITY_WARNING_TIMEOUT = 30 * 60 * 1000; // 30 minutes - show warning
const AUTO_SIGNOUT_TIMEOUT = 60 * 60 * 1000; // 60 minutes - auto signout

export const useSessionManager = ({
  formId,
  userEmail,
  accessMode,
  isFormRequiredSessionChecked,
  formsession,
  setformsession,
  onAutoSignOut,
}: UseSessionManagerProps) => {
  const [userInactive, setUserInactive] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const activityTimeoutRef = useRef<number | null>(null);
  const autoSignoutTimeoutRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const renewFormSession = useRenewFormSession();

  //Get Saved data from localstorage
  const getLocalStorageData = useCallback(() => {
    if (!formId) return null;
    const key = generateStorageKey({
      suffix: "state",
      userKey: userEmail,
      formId,
    });
    const savedData = localStorage.getItem(key);

    return savedData ? (JSON.parse(savedData) as RespondentSessionType) : null;
  }, [formId, userEmail]);

  // Storage management
  const saveLoginStateToStorage = useCallback(
    (state: Partial<RespondentSessionType>) => {
      if (!formId || !userEmail) return;
      const key = generateStorageKey({
        suffix: "state",
        userKey: userEmail,
        formId: formId,
      });
      localStorage.setItem(key, JSON.stringify({ ...state }));
    },
    [formId, userEmail]
  );

  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setUserInactive(false);
    setShowWarning(false);

    // Clear existing timers
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    if (autoSignoutTimeoutRef.current) {
      clearTimeout(autoSignoutTimeoutRef.current);
    }

    if (
      accessMode === "authenticated" &&
      isFormRequiredSessionChecked &&
      formsession?.isActive
    ) {
      // Set 30-minute warning timer
      activityTimeoutRef.current = window.setTimeout(() => {
        setShowWarning(true);
        setUserInactive(true);
        setformsession((prev) => ({
          ...prev,
          isActive: false,
          alert: true,
        }));

        if (formId && userEmail) {
          const key = generateStorageKey({
            suffix: "state",
            userKey: userEmail,
            formId: formId,
          });
          localStorage.removeItem(key);
        }
      }, INACTIVITY_WARNING_TIMEOUT);

      // Set 60-minute auto signout timer
      autoSignoutTimeoutRef.current = window.setTimeout(async () => {
        if (onAutoSignOut) {
          try {
            await onAutoSignOut();
          } catch (error) {
            console.error("Auto signout failed:", error);
            ErrorToast({
              title: "Session Expired",
              content:
                "You have been automatically signed out due to inactivity.",
            });
          }
        }

        // Clear session data
        if (formId && userEmail) {
          const key = generateStorageKey({
            suffix: "state",
            userKey: userEmail,
            formId: formId,
          });
          localStorage.removeItem(key);
        }

        setUserInactive(true);
        setShowWarning(false);
        setformsession({ isActive: false });
      }, AUTO_SIGNOUT_TIMEOUT);
    }
    // Removed setformsession from dependencies to prevent infinite loops
    // The function is stable and setformsession is used inside timeout callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    accessMode,
    isFormRequiredSessionChecked,
    formsession?.isActive,
    formId,
    userEmail,
    onAutoSignOut,
  ]);

  const handleUserActivity = useCallback(() => {
    if (
      accessMode === "authenticated" &&
      (formsession?.isActive || showWarning) && // Allow activity reset even during warning
      userInactive === false // Only reset if not in hard inactive state
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
      !userInactive
    ) {
      const events = [
        "mousedown",
        "mousemove",
        "keypress",
        "scroll",
        "touchstart",
        "click",
      ];

      events.forEach((event) => {
        document.addEventListener(event, handleUserActivity, { passive: true });
      });

      resetActivityTimer();

      return () => {
        events.forEach((event) => {
          document.removeEventListener(event, handleUserActivity);
        });

        if (activityTimeoutRef.current) {
          clearTimeout(activityTimeoutRef.current);
        }
        if (autoSignoutTimeoutRef.current) {
          clearTimeout(autoSignoutTimeoutRef.current);
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

  const handleReactivateSession = useCallback(async () => {
    if (formId && userEmail) {
      const renewReq = await renewFormSession.mutateAsync();

      if (!renewReq.success) {
        ErrorToast({ title: "Session error", content: "Error Occured" });
        return;
      }

      const prevSavedData = getLocalStorageData();
      const sessionData = { ...prevSavedData, isActive: true };
      saveLoginStateToStorage(sessionData);
      setformsession(sessionData);
      setUserInactive(false);
      setShowWarning(false);

      // Restart timers after successful reactivation
      resetActivityTimer();
    }
  }, [
    formId,
    userEmail,
    renewFormSession,
    getLocalStorageData,
    saveLoginStateToStorage,
    setformsession,
    resetActivityTimer,
  ]);

  return {
    userInactive,
    showWarning,
    saveLoginStateToStorage,
    handleReactivateSession,
    showInactivityAlert: userInactive && formsession?.alert,
    renewingSession: renewFormSession.isPending,
    timeUntilAutoSignout: showWarning
      ? AUTO_SIGNOUT_TIMEOUT - INACTIVITY_WARNING_TIMEOUT
      : null,
  };
};
