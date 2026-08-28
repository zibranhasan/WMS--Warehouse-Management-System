"use client";

import { Menu, PanelLeft, Warehouse } from "lucide-react";
import { UserNav } from "./user-nav";

interface HeaderProps {
  onMobileMenuOpen: () => void;
  onDesktopToggleCollapse: () => void;
  isCollapsed: boolean;
}

export function Header({
  onMobileMenuOpen,
  onDesktopToggleCollapse,
  isCollapsed,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-950/95">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onMobileMenuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={onDesktopToggleCollapse}
          className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 lg:flex dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <PanelLeft className="h-5 w-5" />
        </button>

        {/* Brand logo & title */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Warehouse className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-none">
              WMS
            </h1>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              Warehouse Management System
            </p>
          </div>
        </div>
      </div>

      {/* Right User Navigation Menu */}
      <UserNav />
    </header>
  );
}
