import React, { useState, useEffect } from "react";
import { Alert, Button, Card, CardBody, Progress } from "@heroui/react";

interface InactivityAlertProps {
  showFloatingAlert: boolean;
  showFullScreenAlert: boolean;
  isLoading: boolean;
  accessMode: "login" | "guest" | "authenticated";
  onReactivateSession: () => void;
  onSwitchUser: (isGuest: boolean) => void;
  showWarning?: boolean; // New prop for warning state
  timeUntilAutoSignout?: number | null; // Time until auto signout in ms
}

export const InactivityAlert: React.FC<InactivityAlertProps> = ({
  showFloatingAlert,
  showFullScreenAlert,
  isLoading,
  accessMode,
  onReactivateSession,
  onSwitchUser,
  showWarning = false,
  timeUntilAutoSignout = null,
}) => {
  const [countdown, setCountdown] = useState<number>(0);

  // Update countdown every second when auto signout timer is active
  useEffect(() => {
    if (timeUntilAutoSignout && showWarning) {
      setCountdown(Math.floor(timeUntilAutoSignout / 1000));

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timeUntilAutoSignout, showWarning]);

  // Format countdown time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Calculate progress percentage for visual indicator
  const progressPercentage = timeUntilAutoSignout
    ? (countdown / (timeUntilAutoSignout / 1000)) * 100
    : 0;
  if (showFloatingAlert) {
    const isWarningState = showWarning && countdown > 0;

    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20">
        <Alert
          color={isWarningState ? "warning" : "danger"}
          title={isWarningState ? "Session Warning" : "Session Inactive"}
          className="max-w-md dark:bg-gray-800 dark:border-gray-700"
          aria-label="inactive alert modal"
        >
          <div className="flex flex-col gap-2">
            {isWarningState ? (
              <div>
                <p>Your session will expire soon!</p>
                <p className="text-sm">
                  Auto signout in:{" "}
                  <span className="font-bold">{formatTime(countdown)}</span>
                </p>
                <Progress
                  value={progressPercentage}
                  color="warning"
                  size="sm"
                  className="mt-2"
                />
              </div>
            ) : (
              <p>
                Your session has been inactive. Please reactivate to continue.
              </p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                color={isWarningState ? "warning" : "primary"}
                variant="solid"
                onPress={onReactivateSession}
              >
                {isWarningState ? "Extend Session" : "Reactivate Session"}
              </Button>
              <Button
                size="sm"
                variant="light"
                onPress={() => onSwitchUser(accessMode === "guest")}
              >
                Switch User
              </Button>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  if (showFullScreenAlert) {
    const isWarningState = showWarning && countdown > 0;

    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md dark:bg-gray-800">
          <CardBody className="text-center">
            <Alert
              color={isWarningState ? "warning" : "danger"}
              title={
                isWarningState ? "Session Expiring Soon" : "Session Inactive"
              }
              aria-label="full inactive alert"
            >
              {isWarningState ? (
                <div>
                  <p>Your session will expire automatically!</p>
                  <p className="mt-2">
                    Time remaining:{" "}
                    <span className="font-bold text-lg">
                      {formatTime(countdown)}
                    </span>
                  </p>
                </div>
              ) : (
                <p>
                  Your session is currently inactive. Please reactivate to
                  continue with the form.
                </p>
              )}
            </Alert>

            {isWarningState && (
              <Progress
                value={progressPercentage}
                color="warning"
                size="md"
                className="mt-4"
                label="Time remaining"
              />
            )}

            <div className="mt-4 space-y-2">
              <Button
                color={isWarningState ? "warning" : "primary"}
                className="w-full"
                onPress={onReactivateSession}
              >
                {isWarningState ? "Extend Session" : "Reactivate Session"}
              </Button>
              <Button
                variant="light"
                className="w-full"
                isLoading={isLoading}
                onPress={() => onSwitchUser(accessMode === "guest")}
              >
                Switch User
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return null;
};
