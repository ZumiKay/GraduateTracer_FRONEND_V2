import { useState, useEffect, useCallback } from "react";
import { accessModeType } from "../component/Response/hooks/usePaginatedFormData";

interface SessionManagerReturn {
  isSessionActive: boolean;
  timeUntilAutoSignout: number;
  warningMessage: string;
  showInactivityAlert: boolean;
  debugInfo: {
    accessMode: accessModeType;
    formsessionActive: boolean | undefined;
    isFormRequiredSessionChecked: boolean;
    lastActivity: string;
  };
  handleReactivateSession: () => void;
}

interface UseInactivityWarningProps {
  accessMode: accessModeType;
  sessionManager: SessionManagerReturn;
}

interface UseInactivityWarningReturn {
  // Warning display state
  showWarning: boolean;
  isSessionActive: boolean;

  // Time and message data
  timeUntilAutoSignout: number | null;
  formattedTimeDisplay: string | null;
  warningMessage: string | null;

  // Actions
  handleContinueSession: () => void;
  dismissWarning: () => void;

  // Debug information
  debugInfo: {
    accessMode: accessModeType;
    formsessionActive: boolean | undefined;
    isFormRequiredSessionChecked: boolean;
    lastActivity: string;
  };
}

export const useInactivityWarning = (
  props: UseInactivityWarningProps,
): UseInactivityWarningReturn => {
  const { sessionManager, accessMode } = props;
  const [showWarning, setShowWarning] = useState(false);

  // Extract session manager data
  const {
    isSessionActive,
    timeUntilAutoSignout,
    warningMessage,
    showInactivityAlert,
    debugInfo,
    handleReactivateSession,
  } = sessionManager;

  // Show warning when session manager indicates inactivity
  useEffect(() => {
    if (accessMode === "authenticated" || accessMode === "guest") {
      if (showInactivityAlert && !isSessionActive) {
        setShowWarning(true);
      } else if (isSessionActive) {
        setShowWarning(false);
      }
    }
  }, [
    showInactivityAlert,
    isSessionActive,
    timeUntilAutoSignout,
    warningMessage,
    accessMode,
  ]);

  const handleContinueSession = useCallback(() => {
    try {
      if (handleReactivateSession) {
        handleReactivateSession();
      }

      setShowWarning(false);
    } catch (error) {
      console.error("Error continuing session:", error);
    }
  }, [handleReactivateSession]);

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
  }, []);

  const formatTimeDisplay = useCallback(
    (timeMs: number | null): string | null => {
      if (!timeMs || timeMs <= 0) return null;

      const minutes = Math.floor(timeMs / (1000 * 60));
      const seconds = Math.floor((timeMs % (1000 * 60)) / 1000);

      if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      }
      return `${seconds}s`;
    },
    [],
  );

  return {
    // Warning display state
    showWarning,
    isSessionActive,

    // Time and message data
    timeUntilAutoSignout: timeUntilAutoSignout,
    formattedTimeDisplay: formatTimeDisplay(timeUntilAutoSignout),
    warningMessage,

    // Actions
    handleContinueSession,
    dismissWarning,

    // Debug information
    debugInfo,
  };
};
