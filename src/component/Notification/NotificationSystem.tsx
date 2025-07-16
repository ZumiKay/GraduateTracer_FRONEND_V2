import React, { useEffect, useState, useCallback } from "react";
import { Avatar, Button, Chip, Badge, Tooltip } from "@heroui/react";
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import ApiRequest from "../../hooks/ApiHook";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "response" | "reminder" | "alert" | "achievement";
  title: string;
  message: string;
  formId?: string;
  formTitle?: string;
  responseId?: string;
  respondentName?: string;
  respondentEmail?: string;
  isRead: boolean;
  createdAt: string;
  priority: "low" | "medium" | "high";
  actionUrl?: string;
  metadata?: {
    responseCount?: number;
    score?: number;
    completionRate?: number;
  };
}

interface NotificationSystemProps {
  userId: string;
  className?: string;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  userId,
  className,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ApiRequest({
        url: `/api/notifications?userId=${userId}`,
        method: "GET",
        cookie: true,
      });

      if (response.success) {
        const data = response.data as {
          notifications: Notification[];
          unreadCount: number;
        };
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    // Set up polling for real-time updates
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await ApiRequest({
        url: `/api/notifications/${notificationId}/read`,
        method: "PUT",
        cookie: true,
      });

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await ApiRequest({
        url: `/api/notifications/mark-all-read`,
        method: "PUT",
        cookie: true,
        data: { userId },
      });

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await ApiRequest({
        url: `/api/notifications/${notificationId}`,
        method: "DELETE",
        cookie: true,
      });

      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId)
      );
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "response":
        return <CheckIcon className="w-5 h-5 text-green-500" />;
      case "reminder":
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case "alert":
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case "achievement":
        return <CheckIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <BellIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (
    priority: string
  ): "danger" | "warning" | "success" | "default" => {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      window.open(notification.actionUrl, "_blank");
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <Button
        isIconOnly
        variant="light"
        className="relative"
        onPress={() => setIsOpen(!isOpen)}
      >
        <Badge
          content={unreadCount > 0 ? unreadCount : ""}
          color="danger"
          isInvisible={unreadCount === 0}
          showOutline={false}
        >
          <BellIcon className="w-6 h-6" />
        </Badge>
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 max-h-96 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="light"
                  onPress={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setIsOpen(false)}
              >
                <XMarkIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      icon={getNotificationIcon(notification.type)}
                      className="w-8 h-8 bg-gray-100"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={getPriorityColor(notification.priority)}
                          className="text-xs"
                        >
                          {notification.priority}
                        </Chip>
                      </div>

                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {notification.message}
                      </p>

                      {notification.formTitle && (
                        <div className="text-xs text-gray-500 mb-1">
                          Form: {notification.formTitle}
                        </div>
                      )}

                      {notification.respondentName && (
                        <div className="text-xs text-gray-500 mb-1">
                          From: {notification.respondentName}
                        </div>
                      )}

                      {notification.metadata && (
                        <div className="flex gap-2 text-xs text-gray-500 mb-2">
                          {notification.metadata.responseCount && (
                            <span>
                              Responses: {notification.metadata.responseCount}
                            </span>
                          )}
                          {notification.metadata.score && (
                            <span>Score: {notification.metadata.score}</span>
                          )}
                          {notification.metadata.completionRate && (
                            <span>
                              Completion: {notification.metadata.completionRate}
                              %
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            {
                              addSuffix: true,
                            }
                          )}
                        </span>

                        <div className="flex gap-1">
                          {!notification.isRead && (
                            <Tooltip content="Mark as read">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => markAsRead(notification.id)}
                              >
                                <CheckIcon className="w-3 h-3" />
                              </Button>
                            </Tooltip>
                          )}

                          <Tooltip content="Delete">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() =>
                                deleteNotification(notification.id)
                              }
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;
