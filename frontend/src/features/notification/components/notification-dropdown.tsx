"use client";

import React from "react";
import {
  BellOff,
  CheckCheck,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  useDeleteNotification,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
} from "../notification.hooks";
import { NotificationItem } from "./notification-item";

interface NotificationDropdownProps {
  onClose?: () => void;
  unreadCount?: number;
}

export function NotificationDropdown({
  unreadCount = 0,
}: NotificationDropdownProps) {
  const {
    data: notificationsResponse,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useNotifications({ limit: 20 });

  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteMutation = useDeleteNotification();

  const notifications = notificationsResponse?.data || [];

  const handleMarkAllRead = () => {
    if (unreadCount > 0 && !markAllAsReadMutation.isPending) {
      markAllAsReadMutation.mutate();
    }
  };

  return (
    <div className="flex flex-col w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white">
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {unreadCount} unread
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markAllAsReadMutation.isPending}
            className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 transition"
            title="Mark all notifications as read"
          >
            {markAllAsReadMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Mark all read
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="max-h-80 min-h-[160px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {/* Loading Skeletons */}
        {isLoading && (
          <div className="p-3 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-start gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-2.5 w-full rounded bg-slate-100 dark:bg-slate-900" />
                  <div className="h-2 w-1/3 rounded bg-slate-100 dark:bg-slate-900" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Failed to load notifications.
            </p>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              <RefreshCw
                className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`}
              />
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-500">
              <BellOff className="h-5 w-5" />
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              No notifications yet
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              You are all caught up!
            </p>
          </div>
        )}

        {/* Notification List */}
        {!isLoading &&
          !isError &&
          notifications.map((item) => (
            <NotificationItem
              key={item.id}
              notification={item}
              onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
              isMarkingRead={
                markAsReadMutation.isPending &&
                markAsReadMutation.variables === item.id
              }
              isDeleting={
                deleteMutation.isPending && deleteMutation.variables === item.id
              }
            />
          ))}
      </div>
    </div>
  );
}
