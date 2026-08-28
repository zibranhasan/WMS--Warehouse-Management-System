import * as React from "react";
import { FolderOpen } from "lucide-react";

interface TableEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function TableEmptyState({
  title = "No Records Found",
  description = "No records match your filter criteria or search query.",
  icon: Icon = FolderOpen,
}: TableEmptyStateProps) {
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          {description}
        </p>
      </div>
    </div>
  );
}
