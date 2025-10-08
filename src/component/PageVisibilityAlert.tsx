import React from "react";
import { Alert, Button } from "@heroui/react";

interface PageVisibilityAlertProps {
  show: boolean;
  timeAwayFromPage: number;
  onDismiss: () => void;
  isPageVisible: boolean;
}

const formatTime = (milliseconds: number): string => {
  const minutes = Math.floor(milliseconds / (1000 * 60));
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  return `${minutes}m`;
};

export const PageVisibilityAlert: React.FC<PageVisibilityAlertProps> = ({
  show,
  timeAwayFromPage,
  onDismiss,
  isPageVisible,
}) => {
  if (!show || !isPageVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <Alert
        color="warning"
        title="Welcome Back!"
        className="shadow-lg border border-warning-300"
        endContent={
          <Button
            size="sm"
            variant="light"
            color="warning"
            onPress={onDismiss}
            className="ml-2"
          >
            Dismiss
          </Button>
        }
      >
        <div className="space-y-2">
          <p className="text-sm">
            You were away from this page for {formatTime(timeAwayFromPage)}.
            Your session is still active.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 font-medium">
              Session Active
            </span>
          </div>
        </div>
      </Alert>
    </div>
  );
};

export default PageVisibilityAlert;
