import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Progress,
  Chip,
} from "@heroui/react";

export interface AutoLogoutModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  title?: string;
  message?: string;
  reason?: "expired" | "inactivity" | "device_removed" | "unauthorized";
  countdownSeconds?: number;
}

export const AutoLogoutModal: React.FC<AutoLogoutModalProps> = ({
  isOpen,
  onConfirm,
  title,
  message,
  reason = "expired",
  countdownSeconds = 10,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isOpen) return;

    setSecondsLeft(countdownSeconds);
    setProgress(100);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onConfirm();
          return 0;
        }
        const next = prev - 1;
        setProgress((next / countdownSeconds) * 100);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, countdownSeconds, onConfirm]);

  const getReasonText = () => {
    if (message) return message;
    switch (reason) {
      case "inactivity":
        return "You have been signed out due to prolonged inactivity to protect your account security.";
      case "device_removed":
        return "Your session was terminated because a new session was initiated on another device or browser.";
      case "unauthorized":
        return "Your credentials or authentication token are no longer valid. Please sign in again.";
      case "expired":
      default:
        return "Your authentication session has expired. You will be automatically redirected to the login page.";
    }
  };

  const getModalTitle = () => {
    if (title) return title;
    switch (reason) {
      case "inactivity":
        return "Session Timed Out";
      case "device_removed":
        return "Signed Out on Other Device";
      case "unauthorized":
      case "expired":
      default:
        return "Session Expired";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      hideCloseButton={true}
      backdrop="blur"
      size="md"
      aria-label="Auto logout modal"
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
          exit: {
            y: -20,
            opacity: 0,
            scale: 0.95,
            transition: {
              duration: 0.2,
              ease: "easeIn",
            },
          },
        },
      }}
    >
      <ModalContent className="border border-red-200/80 dark:border-red-900/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 w-full" />
        
        <ModalHeader className="flex flex-col items-center text-center pt-6 pb-2 px-6">
          <div className="relative mb-3">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400 ring-8 ring-red-50 dark:ring-red-950/30 animate-pulse">
              <svg
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            {getModalTitle()}
          </h2>
        </ModalHeader>

        <ModalBody className="px-6 py-3 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 text-center leading-relaxed">
            {getReasonText()}
          </p>

          <div className="rounded-xl bg-slate-100/80 dark:bg-slate-800/60 p-3.5 border border-slate-200/70 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Auto Redirecting In
              </span>
              <Chip
                color="danger"
                variant="flat"
                size="sm"
                className="font-mono font-bold text-xs"
              >
                {secondsLeft}s
              </Chip>
            </div>

            <Progress
              value={progress}
              color="danger"
              size="sm"
              aria-label={`Redirecting in ${secondsLeft} seconds`}
              className="w-full"
            />
          </div>
        </ModalBody>

        <ModalFooter className="px-6 pb-6 pt-2">
          <Button
            color="danger"
            size="md"
            className="w-full font-semibold shadow-md shadow-red-500/20"
            onPress={onConfirm}
          >
            Log In Again Now
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AutoLogoutModal;
