import { Shield, Sparkles } from "lucide-react";

interface DashboardHeaderProps {
  userName?: string;
  userRole?: string;
}

export function DashboardHeader({ userName, userRole }: DashboardHeaderProps) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-200" />
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Welcome back, {userName || "User"}!
            </h2>
          </div>
          <p className="text-xs text-blue-100 sm:text-sm">
            WMS Operational Workspace & Management Dashboard
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 backdrop-blur-md self-start sm:self-auto border border-white/20">
          <Shield className="h-4 w-4 text-blue-200" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            {userRole?.replace(/_/g, " ") || "Staff"}
          </span>
        </div>
      </div>
    </div>
  );
}
