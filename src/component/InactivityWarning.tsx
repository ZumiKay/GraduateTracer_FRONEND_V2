import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Progress,
  Card,
  CardBody,
  Chip,
} from "@heroui/react";
import {
  ExclamationTriangleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface InactivityWarningProps {
  isOpen: boolean;
  onReactivate: () => void;
  timeUntilAutoSignout?: number | null;
  warningMessage?: string | null;
  className?: string;
}

export const InactivityWarning: React.FC<InactivityWarningProps> = ({
  isOpen,
  onReactivate,
  timeUntilAutoSignout,
  warningMessage,
  className = "",
}) => {
  const [timeRemaining, setTimeRemaining] = useState(timeUntilAutoSignout || 0);
  const [progressValue, setProgressValue] = useState(100);

  // Update countdown timer
  useEffect(() => {
    if (!isOpen || !timeUntilAutoSignout) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = Math.max(0, prev - 1000);
        const percentage = (newTime / timeUntilAutoSignout) * 100;
        setProgressValue(percentage);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timeUntilAutoSignout]);

  // Reset timer when modal opens
  useEffect(() => {
    if (isOpen && timeUntilAutoSignout) {
      setTimeRemaining(timeUntilAutoSignout);
      setProgressValue(100);
    }
  }, [isOpen, timeUntilAutoSignout]);

  // Format remaining time
  const formatRemainingTime = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Determine color based on remaining time
  const getProgressColor = () => {
    if (progressValue > 50) return "success";
    if (progressValue > 25) return "warning";
    return "danger";
  };

  const getChipColor = () => {
    if (progressValue > 50) return "warning";
    if (progressValue > 25) return "danger";
    return "danger";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Prevent closing without action
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      hideCloseButton={true}
      backdrop="blur"
      size="md"
      aria-label="inactive alert modal #1"
      className={`${className}`}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
          exit: {
            y: -20,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: "easeIn",
            },
          },
        },
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center gap-3 pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning-100 rounded-full">
                  <ExclamationTriangleIcon className="w-6 h-6 text-warning-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Session Inactivity Warning
                  </h3>
                  <p className="text-sm text-foreground-500">
                    Your session will expire soon
                  </p>
                </div>
              </div>
            </ModalHeader>

            <ModalBody className="py-4">
              <Card className="bg-gradient-to-r from-warning-50 to-orange-50 border-l-4 border-l-warning-500">
                <CardBody className="py-4">
                  <div className="space-y-4">
                    {/* Warning Message */}
                    <div className="flex items-start gap-3">
                      <ClockIcon className="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-foreground-700">
                        {warningMessage ||
                          "You've been inactive for 30 minutes. Your session will automatically expire unless you continue working."}
                      </p>
                    </div>

                    {/* Time Remaining Display */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground-600">
                        Time until auto-logout:
                      </span>
                      <Chip
                        color={getChipColor()}
                        variant="flat"
                        size="sm"
                        className="font-mono font-semibold"
                      >
                        {formatRemainingTime(timeRemaining)}
                      </Chip>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <Progress
                        value={progressValue}
                        color={getProgressColor()}
                        className="w-full"
                        size="md"
                        showValueLabel={false}
                        aria-label={`Session time remaining: ${progressValue.toFixed(
                          0
                        )}%`}
                      />
                      <div className="flex justify-between text-xs text-foreground-500">
                        <span>Session expires</span>
                        <span>{progressValue.toFixed(0)}% remaining</span>
                      </div>
                    </div>

                    {/* Action Instructions */}
                    <div className="bg-default-100 p-3 rounded-lg">
                      <p className="text-xs text-foreground-600">
                        💡 <strong>To continue working:</strong> Click "Continue
                        Session" below to reset your activity timer and keep
                        working on your form.
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </ModalBody>

            <ModalFooter className="pt-2">
              <Button
                color="primary"
                variant="solid"
                onPress={onReactivate}
                size="lg"
                className="w-full font-semibold"
                startContent={<ClockIcon className="w-4 h-4" />}
              >
                Continue Session
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

// Export the component as default as well
export default InactivityWarning;
