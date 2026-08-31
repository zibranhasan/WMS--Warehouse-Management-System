"use client";

import { useUser } from "../user.hooks";
import { UserRoleBadge } from "./user-role-badge";
import { UserStatusBadge } from "./user-status-badge";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  KeyRound,
  Loader2,
  Mail,
  ShieldAlert,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import { Role } from "../user.types";

interface UserDetailsDialogProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailsDialog({
  userId,
  isOpen,
  onClose,
}: UserDetailsDialogProps) {
  const { data, isLoading, isError, error, refetch } = useUser(userId || "");

  const user = data?.data;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Account Details"
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mb-3" />
            <p className="text-sm font-medium">Fetching user details...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <PageErrorAlert
            title="Failed to load user details"
            message={
              error instanceof Error
                ? error.message
                : "An unexpected error occurred."
            }
            onRetry={refetch}
          />
        )}

        {/* User Content */}
        {!isLoading && !isError && user && (
          <>
            {/* Header Banner: Avatar & Primary Info */}
            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-8 w-8 text-slate-400" />
                )}
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                    {user.name}
                  </h3>
                  <UserRoleBadge role={user.role as Role} />
                  <UserStatusBadge status={user.status} />
                </div>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </span>
              </div>
            </div>

            {/* Structured Details Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Profile & Identity Section */}
              <div className="space-y-3 rounded-lg border border-slate-200 p-3.5 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Account Overview
                </h4>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">User ID:</span>
                    <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 select-all block truncate">
                      {user.id}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">System Role:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {user.role}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Account Status:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {user.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warehouse & Security Section */}
              <div className="space-y-3 rounded-lg border border-slate-200 p-3.5 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Warehouse & Security
                </h4>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Assigned Warehouse:</span>
                    {user.warehouse ? (
                      <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        {user.warehouse.name} ({user.warehouse.code})
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic">
                        No warehouse assigned
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Email Verified:</span>
                    {user.emailVerified ? (
                      <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Yes (Verified)
                      </span>
                    ) : (
                      <span className="font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                        <XCircle className="h-3.5 w-3.5" /> No (Verification Pending)
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Password Change Required:</span>
                    {user.needPasswordChange ? (
                      <span className="font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                        <ShieldAlert className="h-3.5 w-3.5" /> Yes (Must change on next login)
                      </span>
                    ) : (
                      <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                        <KeyRound className="h-3.5 w-3.5 text-slate-400" /> No
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamps Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Created: <strong className="text-slate-700 dark:text-slate-300">{formatDate(user.createdAt)}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Updated: <strong className="text-slate-700 dark:text-slate-300">{formatDate(user.updatedAt)}</strong>
              </span>
            </div>

            {/* Footer Action */}
            <div className="flex items-center justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
