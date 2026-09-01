"use client";

import { useWarehouseUsers } from "../warehouse.hooks";
import { UserRoleBadge } from "@/features/user/components/user-role-badge";
import { UserStatusBadge } from "@/features/user/components/user-status-badge";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { TableEmptyState } from "@/components/shared/table-empty-state";
import { Role, UserStatus } from "@/features/user/user.types";
import { Users, Mail, User as UserIcon } from "lucide-react";

interface WarehouseAssignedUsersProps {
  warehouseId: string;
}

export function WarehouseAssignedUsers({ warehouseId }: WarehouseAssignedUsersProps) {
  const { data, isLoading, isError, error, refetch } = useWarehouseUsers(warehouseId);

  const users = data?.data || [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          Assigned Employees ({users.length})
        </h3>
      </div>

      {isLoading && (
        <div className="animate-pulse space-y-3">
          <div className="h-10 rounded-lg bg-slate-100 dark:bg-slate-900" />
          <div className="h-10 rounded-lg bg-slate-100 dark:bg-slate-900" />
        </div>
      )}

      {isError && (
        <PageErrorAlert
          title="Error loading assigned users"
          message={error instanceof Error ? error.message : "Failed to load assigned users."}
          onRetry={refetch}
        />
      )}

      {!isLoading && !isError && users.length === 0 && (
        <TableEmptyState
          title="No Assigned Users"
          description="No employees are currently assigned to this warehouse facility."
        />
      )}

      {!isLoading && !isError && users.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-900/60 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                        <UserIcon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {u.name}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {u.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <UserRoleBadge role={u.role as Role} />
                  </td>
                  <td className="px-4 py-3">
                    <UserStatusBadge status={u.status as UserStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
