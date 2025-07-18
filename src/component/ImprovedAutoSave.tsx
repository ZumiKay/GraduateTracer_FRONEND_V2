import React from "react";
import { Chip, Tooltip, Button } from "@heroui/react";
import {
  FiWifi,
  FiWifiOff,
  FiSave,
  FiAlertCircle,
  FiCheck,
  FiRefreshCw,
} from "react-icons/fi";
import useImprovedAutoSave from "../hooks/useImprovedAutoSave";

interface ImprovedAutoSaveProps {
  className?: string;
  showManualSave?: boolean;
  showLastSaved?: boolean;
  showOfflineIndicator?: boolean;
  config?: {
    debounceMs?: number;
    retryAttempts?: number;
    retryDelayMs?: number;
    offlineQueueSize?: number;
  };
}

const ImprovedAutoSave: React.FC<ImprovedAutoSaveProps> = ({
  className = "",
  showManualSave = true,
  showLastSaved = true,
  showOfflineIndicator = true,
  config = {},
}) => {
  const { autoSaveStatus, manualSave, isOnline, offlineQueueSize } =
    useImprovedAutoSave(config);

  const getStatusColor = () => {
    switch (autoSaveStatus.status) {
      case "saving":
        return "warning";
      case "saved":
        return "success";
      case "error":
        return "danger";
      case "offline":
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusIcon = () => {
    switch (autoSaveStatus.status) {
      case "saving":
        return <FiRefreshCw className="animate-spin" />;
      case "saved":
        return <FiCheck />;
      case "error":
        return <FiAlertCircle />;
      case "offline":
        return <FiWifiOff />;
      default:
        return <FiSave />;
    }
  };

  const getStatusText = () => {
    switch (autoSaveStatus.status) {
      case "saving":
        return autoSaveStatus.retryCount > 0
          ? `Retrying... (${autoSaveStatus.retryCount})`
          : "Saving...";
      case "saved":
        return "Saved";
      case "error":
        return "Save failed";
      case "offline":
        return "Offline";
      default:
        return "Ready";
    }
  };

  const getTooltipContent = () => {
    let content = getStatusText();

    if (autoSaveStatus.lastSaved && showLastSaved) {
      content += `\nLast saved: ${autoSaveStatus.lastSaved.toLocaleTimeString()}`;
    }

    if (autoSaveStatus.error) {
      content += `\nError: ${autoSaveStatus.error}`;
    }

    if (!isOnline && offlineQueueSize > 0) {
      content += `\n${offlineQueueSize} changes queued for sync`;
    }

    return content;
  };

  const handleManualSave = async () => {
    await manualSave();
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Connection Status */}
      {showOfflineIndicator && (
        <Tooltip content={isOnline ? "Connected" : "Offline"}>
          <div className="flex items-center">
            {isOnline ? (
              <FiWifi className="text-green-500 w-4 h-4" />
            ) : (
              <FiWifiOff className="text-red-500 w-4 h-4" />
            )}
          </div>
        </Tooltip>
      )}

      {/* Auto-save Status */}
      <Tooltip content={getTooltipContent()}>
        <Chip
          color={getStatusColor()}
          variant="flat"
          size="sm"
          startContent={getStatusIcon()}
          className="cursor-help"
        >
          {getStatusText()}
        </Chip>
      </Tooltip>

      {/* Offline Queue Indicator */}
      {!isOnline && offlineQueueSize > 0 && (
        <Tooltip content={`${offlineQueueSize} changes queued for sync`}>
          <Chip
            color="warning"
            variant="flat"
            size="sm"
            className="cursor-help"
          >
            {offlineQueueSize} queued
          </Chip>
        </Tooltip>
      )}

      {/* Manual Save Button */}
      {showManualSave && (
        <Tooltip content="Save manually">
          <Button
            size="sm"
            variant="light"
            isIconOnly
            onPress={handleManualSave}
            isDisabled={autoSaveStatus.status === "saving"}
            className="min-w-unit-8 w-unit-8 h-unit-8"
          >
            <FiSave className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}
    </div>
  );
};

export default ImprovedAutoSave;
