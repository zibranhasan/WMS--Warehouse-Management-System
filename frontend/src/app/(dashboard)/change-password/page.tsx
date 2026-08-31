"use client";

import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { KeyRound } from "lucide-react";

export default function ChangePasswordPage() {
  return (
    <div className="max-w-xl mx-auto space-y-6 pt-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Change Password
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Update your account password. Once changed, all other active sessions will be invalidated.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
