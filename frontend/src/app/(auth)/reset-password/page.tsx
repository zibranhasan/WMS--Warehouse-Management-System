"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

function ResetPasswordFormWrapper() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  return <ResetPasswordForm initialEmail={emailParam} />;
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 sm:px-6 lg:px-8 dark:bg-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
            <KeyRound className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Reset Your Password
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600 dark:text-slate-400">
          Enter the 6-digit OTP sent to your email along with your new password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-6 py-8 shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl sm:px-10 dark:bg-slate-950 dark:ring-slate-800">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-8 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            }
          >
            <ResetPasswordFormWrapper />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
