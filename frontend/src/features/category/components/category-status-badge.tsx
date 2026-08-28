import { CategoryStatus } from "../category.types";

interface CategoryStatusBadgeProps {
  status: CategoryStatus;
}

export function CategoryStatusBadge({ status }: CategoryStatusBadgeProps) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300">
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-800 dark:text-slate-400">
      Inactive
    </span>
  );
}
