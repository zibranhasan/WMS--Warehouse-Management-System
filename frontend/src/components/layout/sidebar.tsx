"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { getFilteredNavigation } from "@/config/navigation.config";

interface SidebarProps {
  isCollapsed: boolean;
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { data: meData, isLoading } = useCurrentUser();
  const user = meData?.data?.user;

  const navGroups = getFilteredNavigation(user?.role);

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 transition-all duration-300 z-20 shrink-0 min-h-0 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Navigation Links Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {isLoading ? (
          /* Loading Skeletons */
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-8 rounded-lg bg-slate-100 dark:bg-slate-900 animate-pulse"
              />
            ))}
          </div>
        ) : (
          navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {group.groupTitle}
                </p>
              )}
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.title : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        isActive
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                      } ${isCollapsed ? "justify-center px-0" : ""}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.title}</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
