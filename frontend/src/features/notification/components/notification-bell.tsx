"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import {
  useNotificationRealtime,
  useUnreadNotificationCount,
} from "../notification.hooks";
import { NotificationDropdown } from "./notification-dropdown";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Activate real-time Socket.IO synchronization for incoming notifications
  useNotificationRealtime();

  // Fetch current unread count
  const { data: countResponse } = useUnreadNotificationCount();
  const unreadCount = countResponse?.data?.count || 0;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const badgeDisplay = unreadCount > 99 ? "99+" : unreadCount.toString();

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 transition outline-none"
        aria-label={`Notifications (${unreadCount} unread)`}
        title="Notifications"
      >
        <Bell className="h-4 w-4" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-950 animate-in zoom-in-50">
            {badgeDisplay}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 z-50">
          <NotificationDropdown
            unreadCount={unreadCount}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
