import { useState, useEffect, useCallback } from "react";
import { useSessionManager } from "../hooks/useSessionManager";
import { RespondentSessionType } from "../component/Response/Response.type";
import { accessModeType } from "../component/Response/hooks/usePaginatedFormData";

interface UseInactivityWarningProps {
  formId?: string;
  userEmail?: string;
  accessMode: accessModeType;
  isFormRequiredSessionChecked: boolean;
  formsession?: Partial<RespondentSessionType>;
  setformsession: React.Dispatch<
    React.SetStateAction<Partial<RespondentSessionType> | undefined>
  >;
  onAutoSignOut?: () => Promise<void>;
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
  props: UseInactivityWarningProps
): UseInactivityWarningReturn => {
  const sessionManager = useSessionManager(props);
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
    if (showInactivityAlert && !isSessionActive) {
      console.log("🚨 [InactivityWarning] Showing inactivity warning", {
        isSessionActive,
        showInactivityAlert,
        timeUntilAutoSignout,
        warningMessage,
      });
      setShowWarning(true);
    } else if (isSessionActive) {
      console.log(
        "✅ [InactivityWarning] Session reactivated, hiding warning",
        {
          isSessionActive,
          showInactivityAlert,
        }
      );
      setShowWarning(false);
    }
  }, [
    showInactivityAlert,
    isSessionActive,
    timeUntilAutoSignout,
    warningMessage,
  ]);

  // Handle continue session action
  const handleContinueSession = useCallback(() => {
    console.log("🔄 [InactivityWarning] User requested to continue session");

    try {
      // Call the session manager's reactivate function
      if (handleReactivateSession) {
        handleReactivateSession();
      }

      // Hide the warning
      setShowWarning(false);

      console.log("✅ [InactivityWarning] Session continuation successful");
    } catch (error) {
      console.error("❌ [InactivityWarning] Error continuing session:", error);
      // Keep warning visible if reactivation failed
    }
  }, [handleReactivateSession]);

  // Manual dismiss (for testing purposes)
  const dismissWarning = useCallback(() => {
    console.log("🔕 [InactivityWarning] Warning manually dismissed");
    setShowWarning(false);
  }, []);

  // Create formatted time display for the UI
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
    []
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
