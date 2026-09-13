"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Shield,
  BadgeCheck,
  Warehouse,
  Calendar,
  KeyRound,
  Pencil,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { EditProfileForm } from "@/features/auth/components/edit-profile-form";
import { PageErrorAlert } from "@/components/shared/page-error-alert";

function formatRole(role: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    WAREHOUSE_MANAGER: "Warehouse Manager",
    PROCUREMENT: "Procurement",
    STAFF: "Staff",
    FINANCE: "Finance",
  };
  return map[role] || role;
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: "Active",
    BLOCKED: "Blocked",
    DELETED: "Deleted",
  };
  return map[status] || status;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ProfilePage() {
  const { data: meData, isLoading, error, refetch } = useCurrentUser();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const user = meData?.data?.user;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pt-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <User className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Profile
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your account information and preferences.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pt-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <User className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Profile
            </h1>
          </div>
        </div>
        <PageErrorAlert
          message="Failed to load profile information."
          onRetry={() => refetch()}
        />
      </div>
    );
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
    <div className="max-w-2xl mx-auto space-y-6 pt-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <User className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Profile
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your account information and preferences.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditOpen(true)}
          className="mt-1"
        >
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit Profile
        </Button>
      </div>

      {/* Password change notice */}
      {user.needPasswordChange && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Your temporary password must be changed.</p>
            <Link
              href="/change-password"
              className="mt-1 inline-flex items-center text-xs font-semibold text-amber-800 underline hover:text-amber-900 dark:text-amber-200 dark:hover:text-amber-100"
            >
              Change Password Now &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {/* Avatar + Name */}
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-white">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {user.name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                {formatRole(user.role)}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  user.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : user.status === "BLOCKED"
                      ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {formatStatus(user.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid gap-4 pt-5 sm:grid-cols-2">
          <InfoRow
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={user.email}
          />
          <InfoRow
            icon={<Shield className="h-4 w-4" />}
            label="Role"
            value={formatRole(user.role)}
          />
          <InfoRow
            icon={<BadgeCheck className="h-4 w-4" />}
            label="Email Verification"
            value={user.emailVerified ? "Verified" : "Not Verified"}
            valueClassName={
              user.emailVerified
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            }
          />
          <InfoRow
            icon={<Warehouse className="h-4 w-4" />}
            label="Warehouse"
            value={
              user.warehouse
                ? `${user.warehouse.name} (${user.warehouse.code})`
                : "Global Access"
            }
          />
          <InfoRow
            icon={<Calendar className="h-4 w-4" />}
            label="Member Since"
            value={formatDate(user.createdAt)}
          />
          <InfoRow
            icon={<User className="h-4 w-4" />}
            label="Account Status"
            value={formatStatus(user.status)}
          />
        </div>

        {/* Change Password Link */}
        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Link href="/change-password">
            <Button variant="outline" size="sm">
              <KeyRound className="mr-1.5 h-3.5 w-3.5" />
              Change Password
            </Button>
          </Link>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <EditProfileForm
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        user={user}
      />
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-slate-400 dark:text-slate-500">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p
          className={`mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-200 truncate ${valueClassName || ""}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
