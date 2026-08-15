import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, AlertTriangle, TrendingDown, Check, Trash2 } from "lucide-react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type Notification,
} from "../lib/notifications";

function formatRelativeTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(),
    // Poll so a budget alert fired by the backend job shows up without a
    // manual refresh — cheap since this is a small list per user.
    refetchInterval: 60_000,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // Close the dropdown on outside click.
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handleNotificationClick(notification: Notification) {
    if (!notification.read) markReadMutation.mutate(notification.id);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-sprout-text-muted hover:text-sprout-text hover:bg-sprout-bg transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 font-medium text-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 flex flex-col bg-sprout-surface border border-sprout-border rounded-sprout shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-sprout-border">
            <p className="font-display text-sm text-sprout-text font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs text-sprout-primary hover:opacity-80 transition-opacity"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <p className="text-sprout-text-muted text-sm p-6 text-center">Loading...</p>
            )}
            {!isLoading && notifications.length === 0 && (
              <p className="text-sprout-text-muted text-sm p-6 text-center">
                You're all caught up.
              </p>
            )}
            {notifications.map((notification) => {
              const isExceeded = notification.type === "BUDGET_EXCEEDED";
              const Icon = isExceeded ? AlertTriangle : TrendingDown;
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-sprout-border last:border-b-0 cursor-pointer transition-colors ${
                    notification.read ? "bg-sprout-surface" : "bg-sprout-primary-light/40"
                  } hover:bg-sprout-bg`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isExceeded ? "bg-red-100 text-red-500" : "bg-sprout-primary-light text-sprout-warning"
                    }`}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sprout-text text-sm font-medium truncate">
                      {notification.title}
                    </p>
                    <p className="text-sprout-text-muted text-xs mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-sprout-text-muted text-[11px] mt-1">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markReadMutation.mutate(notification.id);
                        }}
                        className="text-sprout-text-muted hover:text-sprout-primary transition-colors"
                        aria-label="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(notification.id);
                      }}
                      className="text-sprout-text-muted hover:text-red-500 transition-colors"
                      aria-label="Delete notification"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}