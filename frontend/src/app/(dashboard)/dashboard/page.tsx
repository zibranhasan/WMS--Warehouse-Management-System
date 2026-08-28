"use client";

import { useCurrentUser } from "@/features/auth/auth.hooks";
import { useDashboardMetrics } from "@/features/dashboard/dashboard.hooks";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { AdminDashboard } from "@/features/dashboard/components/admin-dashboard";
import { WarehouseDashboard } from "@/features/dashboard/components/warehouse-dashboard";
import { ProcurementDashboard } from "@/features/dashboard/components/procurement-dashboard";
import { FinanceDashboard } from "@/features/dashboard/components/finance-dashboard";
import { StaffDashboard } from "@/features/dashboard/components/staff-dashboard";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { data: meData, isLoading: isLoadingUser } = useCurrentUser();
  const user = meData?.data?.user;

  const { data: metrics, isLoading: isLoadingMetrics } = useDashboardMetrics(
    user?.role
  );

  if (isLoadingUser) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">
            Loading session context...
          </p>
        </div>
      </div>
    );
  }

  const role = user?.role;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <DashboardHeader userName={user?.name} userRole={role} />

      {/* Role-Specific Dashboard Views */}
      {role === "SUPER_ADMIN" || role === "ADMIN" ? (
        <AdminDashboard metrics={metrics} isLoading={isLoadingMetrics} />
      ) : role === "WAREHOUSE_MANAGER" ? (
        <WarehouseDashboard metrics={metrics} isLoading={isLoadingMetrics} />
      ) : role === "PROCUREMENT" ? (
        <ProcurementDashboard metrics={metrics} isLoading={isLoadingMetrics} />
      ) : role === "FINANCE" ? (
        <FinanceDashboard metrics={metrics} isLoading={isLoadingMetrics} />
      ) : (
        <StaffDashboard metrics={metrics} isLoading={isLoadingMetrics} />
      )}
    </div>
  );
}
