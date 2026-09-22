import React, { useEffect, useState, useCallback, useRef } from "react";
import { Button, Chip, Badge, Tooltip } from "@heroui/react";
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import ApiRequest from "../../hooks/APIHook/ApiHook";
import { formatDistanceToNow } from "date-fns";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

interface Notification {
  _id: string;
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

const NotificationSystem: React.FC<NotificationSystemProps> = ({ userId, className }) => {
  const users = useSelector((root: RootState) => root.usersession);
  const openmodal = useSelector((root: RootState) => root.openmodal);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markLoading, setmarkLoading] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Automatically close notifications if any modal opens
  useEffect(() => {
    if (isOpen && Object.values(openmodal).some((modal) => modal === true)) {
      setIsOpen(false);
    }
  }, [openmodal, isOpen]);

  // Close notifications on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  //Fetch method
  const fetchNotifications = useCallback(async () => {
    if (!users.user?._id) return;
    try {
      setLoading(true);
      const response = await ApiRequest({
        url: `/notifications?userId=${users.user?._id}`,
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
  }, [users.user?._id]);

  // Set up SSE for real-time notifications
  useEffect(() => {
    if (!users.user?._id) return;

    // Fetch initial notifications
    fetchNotifications();

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/v0/api";

    const eventSource = new EventSource(`${apiUrl}/notifications/stream`, {
      withCredentials: true,
    });

    eventSource.onopen = () => {
      console.log("[SSE] Connected to notification stream");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "connected") {
          console.log("[SSE] Connection confirmed:", data.message);
          return;
        }

        if (data.type === "new_response" && data.notification) {
          // Add new notification to the top of the list
          setNotifications((prev) => [data.notification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Show browser notification if permission granted
          if (Notification.permission === "granted") {
            new Notification(data.notification.title, {
              body: data.notification.message,
              icon: "/favicon.ico",
              tag: data.notification.id,
            });
          }
        }
      } catch (error) {
        console.error("[SSE] Error parsing message:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("[SSE] Connection error:", error);
      eventSource.close();
    };

    // Request notification permission on mount
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      //close connection
      eventSource.close();
    };
  }, [users.user?._id, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      setmarkLoading(true);
      await ApiRequest({
        url: `/notifications/${notificationId}/read`,
        method: "PUT",
        cookie: true,
      });
      setmarkLoading(false);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId ? { ...notification, isRead: true } : notification,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      await ApiRequest({
        url: `/notifications/mark-all-read`,
        method: "PUT",
        cookie: true,
        data: { userId },
      });
      setLoading(false);

      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      setmarkLoading(true);
      await ApiRequest({
        url: `/notifications/${notificationId}`,
        method: "DELETE",
        cookie: true,
      });
      setmarkLoading(false);

      setNotifications((prev) =>
        prev.filter((notification) => notification._id !== notificationId),
      );
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "response":
        return (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-sm shrink-0">
            <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
        );
      case "reminder":
        return (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shrink-0">
            <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
        );
      case "alert":
        return (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-sm shrink-0">
            <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
        );
      case "achievement":
        return (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm shrink-0">
            <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-sm shrink-0">
            <BellIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
        );
    }
  };

  const getPriorityColor = (priority: string): "danger" | "warning" | "success" | "default" => {
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
      markAsRead(notification._id);
    }

    if (notification.actionUrl) {
      window.open(notification.actionUrl, "_blank");
    }
  };

  return (
    <div ref={notificationRef} className={`relative ${className}`}>
      {/* Notification Bell */}
      <Button
        isIconOnly
        variant="light"
        className="relative hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 w-8 h-8 sm:w-10 sm:h-10 min-w-0"
        onPress={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Badge
          content={unreadCount > 0 ? unreadCount : ""}
          color="danger"
          isInvisible={unreadCount === 0}
          showOutline={false}
          className="animate-pulse"
        >
          <BellIcon
            className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 ${
              unreadCount > 0
                ? "text-blue-600 dark:text-blue-400 animate-wiggle"
                : "text-gray-700 dark:text-gray-300"
            }`}
          />
        </Badge>
      </Button>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] sm:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="fixed inset-x-2 top-14 sm:absolute sm:inset-auto sm:right-0 sm:top-12 w-auto sm:w-96 max-w-[calc(100vw-1rem)] sm:max-w-md bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/60 dark:border-gray-700/60 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3.5 py-3 sm:px-4 sm:py-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center sticky top-0 z-10">
            <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5 sm:gap-2 truncate">
              <BellIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs font-normal text-gray-600 dark:text-gray-400 shrink-0">
                  ({unreadCount} new)
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  onPress={markAllAsRead}
                  className="text-[11px] sm:text-xs font-medium px-2 sm:px-3 h-7 sm:h-8 hover:scale-105 transition-transform"
                >
                  Mark all read
                </Button>
              )}
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setIsOpen(false)}
                className="w-7 h-7 sm:w-8 sm:h-8 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
                aria-label="Close notifications"
              >
                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 dark:text-gray-300" />
              </Button>
            </div>
          </div>

          <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-6 sm:p-8 text-center">
                <div className="inline-block w-7 h-7 sm:w-8 sm:h-8 border-3 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Loading notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 sm:p-8 text-center">
                <BellIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 dark:text-gray-600 mb-2 sm:mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium text-xs sm:text-sm">
                  No notifications yet
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 mt-1">
                  You're all caught up!
                </p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div
                  key={notification._id}
                  className={`group p-3 sm:p-4 border-b border-gray-100/80 dark:border-gray-700/80 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 cursor-pointer transition-all duration-300 hover:shadow-sm animate-in fade-in slide-in-from-left ${
                    !notification.isRead
                      ? "bg-gradient-to-r from-blue-50/80 to-indigo-50/40 dark:from-blue-900/30 dark:to-indigo-900/20 border-l-4 border-l-blue-500 dark:border-l-blue-400"
                      : "hover:border-l-4 hover:border-l-blue-300 dark:hover:border-l-blue-600"
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="flex-shrink-0 transition-transform group-hover:scale-110 duration-200">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                        <h4 className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                          {notification.title}
                        </h4>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={getPriorityColor(notification.priority)}
                          className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide h-4 sm:h-5 shrink-0"
                        >
                          {notification.priority}
                        </Chip>
                        {!notification.isRead && (
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse shrink-0"></span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2 leading-relaxed break-words">
                        {notification.message}
                      </p>

                      {(notification.formTitle || notification.respondentName) && (
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          {notification.formTitle && (
                            <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5 max-w-full">
                              <span className="font-medium shrink-0">📋</span>
                              <span className="font-medium truncate max-w-[140px] sm:max-w-[200px]">
                                {notification.formTitle}
                              </span>
                            </div>
                          )}

                          {notification.respondentName && (
                            <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/30 rounded-full px-2 py-0.5 max-w-full">
                              <span className="font-medium shrink-0">👤</span>
                              <span className="font-medium truncate max-w-[120px] sm:max-w-[160px]">
                                {notification.respondentName}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {notification.metadata && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {notification.metadata.responseCount && (
                            <span className="text-[10px] sm:text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                              {notification.metadata.responseCount} responses
                            </span>
                          )}
                          {notification.metadata.score && (
                            <span className="text-[10px] sm:text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
                              Score: {notification.metadata.score}
                            </span>
                          )}
                          {notification.metadata.completionRate && (
                            <span className="text-[10px] sm:text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
                              {notification.metadata.completionRate}% complete
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                          <ClockIcon className="w-3 h-3 shrink-0" />
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </span>

                        <div
                          className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!notification.isRead && (
                            <Tooltip content="Mark as read">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="flat"
                                color="success"
                                isLoading={markLoading}
                                onPress={() => markAsRead(notification._id)}
                                className="w-7 h-7 min-w-0 hover:scale-110 transition-transform"
                                aria-label="Mark as read"
                              >
                                <CheckIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </Button>
                            </Tooltip>
                          )}

                          <Tooltip content="Delete">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="flat"
                              color="danger"
                              isLoading={markLoading}
                              onPress={() => deleteNotification(notification._id)}
                              className="w-7 h-7 min-w-0 hover:scale-110 transition-transform"
                              aria-label="Delete notification"
                            >
                              <XMarkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
