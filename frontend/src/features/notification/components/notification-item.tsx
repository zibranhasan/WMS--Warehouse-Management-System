"use client";

import React from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Bell,
  Trash2,
  Loader2,
} from "lucide-react";
import { INotification, NotificationType } from "../notification.types";

interface NotificationItemProps {
  notification: INotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  isMarkingRead?: boolean;
  isDeleting?: boolean;
}

const typeConfig: Record<
  NotificationType,
  { icon: React.ComponentType<{ className?: string }>; colorClass: string; bgClass: string; label: string }
> = {
  INFO: {
    icon: Info,
    colorClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-950/60",
    label: "Info",
  },
  SUCCESS: {
    icon: CheckCircle2,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/60",
    label: "Success",
  },
  WARNING: {
    icon: AlertTriangle,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-950/60",
    label: "Warning",
  },
  ERROR: {
    icon: AlertCircle,
    colorClass: "text-red-600 dark:text-red-400",
    bgClass: "bg-red-50 dark:bg-red-950/60",
    label: "Error",
  },
  SYSTEM: {
    icon: Bell,
    colorClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-50 dark:bg-purple-950/60",
    label: "System",
  },
};

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  isMarkingRead = false,
  isDeleting = false,
}: NotificationItemProps) {
  const config = typeConfig[notification.type] || typeConfig.INFO;
  const Icon = config.icon;

  const handleClick = () => {
    if (!notification.isRead && !isMarkingRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDeleting) {
      onDelete(notification.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`group relative flex items-start gap-3 p-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900/60 cursor-pointer ${
        !notification.isRead
          ? "bg-blue-50/40 dark:bg-blue-950/20"
          : "bg-transparent opacity-90"
      }`}
    >
      {/* Type Icon */}
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bgClass} ${config.colorClass}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
            {notification.title}
          </span>
          {!notification.isRead && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400"
              aria-label="Unread notification"
            />
          )}
        </div>

        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed break-words">
          {notification.message}
        </p>

        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
          <span>{formatRelativeTime(notification.createdAt)}</span>
          {notification.entityType && (
            <>
              <span>•</span>
              <span className="font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {notification.entityType.replace(/_/g, " ")}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Delete Action Button */}
      <div className="absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition"
          aria-label={`Delete notification: ${notification.title}`}
          title="Delete notification"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
