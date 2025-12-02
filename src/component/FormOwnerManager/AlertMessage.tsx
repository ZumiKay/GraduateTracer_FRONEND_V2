import React from "react";
import { ErrorIcon, SuccessIcon, InfoIcon } from "./Icons";

interface AlertMessageProps {
  message: string;
  type: "error" | "success" | "info";
}

const alertStyles = {
  error: {
    container:
      "bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400",
    icon: "text-red-600 dark:text-red-400",
    text: "text-red-600 dark:text-red-400",
  },
  success: {
    container:
      "bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400",
    icon: "text-green-600 dark:text-green-400",
    text: "text-green-600 dark:text-green-400",
  },
  info: {
    container:
      "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500 dark:border-blue-400",
    icon: "text-blue-600 dark:text-blue-400",
    text: "text-blue-700 dark:text-blue-300",
  },
};

const iconMap = {
  error: ErrorIcon,
  success: SuccessIcon,
  info: InfoIcon,
};

export const AlertMessage: React.FC<AlertMessageProps> = ({
  message,
  type,
}) => {
  const styles = alertStyles[type];
  const Icon = iconMap[type];

  return (
    <div className={`${styles.container} rounded-md p-4 shadow-sm`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${styles.icon} flex-shrink-0 mt-0.5`} />
        <p className={`${styles.text} text-sm font-medium`}>{message}</p>
      </div>
    </div>
  );
};

export default AlertMessage;
