"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser, useLogout } from "@/features/auth/auth.hooks";
import { LogOut, User as UserIcon, Loader2, ChevronDown } from "lucide-react";

export function UserNav() {
  const router = useRouter();
  const { data: meData } = useCurrentUser();
  const logoutMutation = useLogout();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = meData?.data?.user;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setIsOpen(false);
        router.push("/login");
      },
    });
  };

  if (!user) {
    return null;
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 rounded-lg p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-900 outline-none"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-xs">
          {initials}
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
            {user.name}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            {user.role}
          </p>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-950 z-50 animate-in fade-in-50 zoom-in-95">
          {/* User Info Header */}
          <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {user.name}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </p>
            <div className="mt-1">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                {user.role}
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900 transition"
            >
              <UserIcon className="h-4 w-4 text-slate-500" />
              Profile Settings
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-slate-100 pt-1 dark:border-slate-800">
            <button
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition disabled:opacity-50"
            >
              {logoutMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
