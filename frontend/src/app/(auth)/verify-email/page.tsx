"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MailCheck, Loader2 } from "lucide-react";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";

function VerifyEmailFormWrapper() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  return <VerifyEmailForm initialEmail={emailParam} />;
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 sm:px-6 lg:px-8 dark:bg-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
            <MailCheck className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Verify your email
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600 dark:text-slate-400">
          We&apos;ve sent a 6-digit verification code to your email address.
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
            <VerifyEmailFormWrapper />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
