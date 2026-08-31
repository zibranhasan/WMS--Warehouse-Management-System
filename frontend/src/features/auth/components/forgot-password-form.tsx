"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { forgotPasswordSchema, ForgotPasswordSchemaType } from "../auth.schema";
import { useForgotPassword } from "../auth.hooks";
import { ApiError } from "@/lib/api/api-error";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [successState, setSuccessState] = useState<{
    message: string;
    email: string;
  } | null>(null);

  const forgotPasswordMutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordSchemaType>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: ForgotPasswordSchemaType) => {
    setSuccessState(null);
    forgotPasswordMutation.mutate(data, {
      onSuccess: (res) => {
        setSuccessState({
          message:
            res.message ||
            "If an account exists for this email, a password reset OTP has been sent.",
          email: data.email,
        });
      },
    });
  };

  const getErrorMessage = (): string | null => {
    if (!forgotPasswordMutation.error) return null;
    if (forgotPasswordMutation.error instanceof ApiError) {
      return forgotPasswordMutation.error.message;
    }
    return (
      forgotPasswordMutation.error.message ||
      "An unexpected error occurred while requesting password reset."
    );
  };

  const serverError = getErrorMessage();

  return (
    <div className="space-y-5">
      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <div className="flex-1 font-medium">{serverError}</div>
        </div>
      )}

      {successState ? (
        <div className="space-y-5">
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div className="flex-1 font-medium">{successState.message}</div>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              type="button"
              onClick={() =>
                router.push(
                  `/reset-password?email=${encodeURIComponent(
                    successState.email
                  )}`
                )
              }
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors"
            >
              Proceed to Reset Password
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Email Field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                aria-invalid={errors.email ? "true" : "false"}
                {...register("email")}
                className={`w-full rounded-md border bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 dark:bg-slate-950 dark:text-slate-100 ${
                  errors.email
                    ? "border-red-500 focus:ring-red-500/20"
                    : "border-slate-300 focus:border-blue-600 focus:ring-blue-600/20 dark:border-slate-800"
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={forgotPasswordMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors"
          >
            {forgotPasswordMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending Reset OTP...
              </span>
            ) : (
              "Send Reset OTP"
            )}
          </Button>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
