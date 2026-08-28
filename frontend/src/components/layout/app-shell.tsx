"use client";

import { useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { MobileSidebar } from "./mobile-sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <Header
        onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
        onDesktopToggleCollapse={() => setIsDesktopCollapsed((prev) => !prev)}
        isCollapsed={isDesktopCollapsed}
      />

      {/* Main Body Area: Sidebar + Main Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop Persistent Sidebar */}
        <Sidebar isCollapsed={isDesktopCollapsed} />

        {/* Mobile Slide-over Drawer */}
        <MobileSidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
