"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { resetPasswordSchema, ResetPasswordSchemaType } from "../auth.schema";
import { useResetPassword } from "../auth.hooks";
import { ApiError } from "@/lib/api/api-error";

interface ResetPasswordFormProps {
  initialEmail?: string;
}

export function ResetPasswordForm({ initialEmail = "" }: ResetPasswordFormProps) {
  const router = useRouter();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetPasswordMutation = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordSchemaType>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: initialEmail,
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: ResetPasswordSchemaType) => {
    setSuccessMessage(null);
    resetPasswordMutation.mutate(
      {
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      },
      {
        onSuccess: (res) => {
          setSuccessMessage(
            res.message || "Password reset successfully. Redirecting to sign in..."
          );
          setTimeout(() => {
            router.push("/login");
          }, 1500);
        },
      }
    );
  };

  const getErrorMessage = (): string | null => {
    if (!resetPasswordMutation.error) return null;
    if (resetPasswordMutation.error instanceof ApiError) {
      return resetPasswordMutation.error.message;
    }
    return (
      resetPasswordMutation.error.message ||
      "An unexpected error occurred while resetting your password."
    );
  };

  const serverError = getErrorMessage();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <div className="flex-1 font-medium">{serverError}</div>
        </div>
      )}

      {successMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
        </div>
      )}

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

      {/* OTP Field */}
      <div className="space-y-2">
        <label
          htmlFor="otp"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          6-Digit Reset OTP
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <KeyRound className="h-4 w-4" />
          </div>
          <input
            id="otp"
            type="text"
            maxLength={6}
            placeholder="123456"
            autoComplete="one-time-code"
            aria-invalid={errors.otp ? "true" : "false"}
            {...register("otp")}
            className={`w-full rounded-md border bg-white py-2 pl-10 pr-3 text-sm tracking-widest font-mono text-slate-900 placeholder:text-slate-400 placeholder:tracking-normal focus:outline-none focus:ring-2 dark:bg-slate-950 dark:text-slate-100 ${
              errors.otp
                ? "border-red-500 focus:ring-red-500/20"
                : "border-slate-300 focus:border-blue-600 focus:ring-blue-600/20 dark:border-slate-800"
            }`}
          />
        </div>
        {errors.otp && (
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            {errors.otp.message}
          </p>
        )}
      </div>

      {/* New Password Field */}
      <div className="space-y-2">
        <label
          htmlFor="newPassword"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          New Password
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Lock className="h-4 w-4" />
          </div>
          <input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            aria-invalid={errors.newPassword ? "true" : "false"}
            {...register("newPassword")}
            className={`w-full rounded-md border bg-white py-2 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 dark:bg-slate-950 dark:text-slate-100 ${
              errors.newPassword
                ? "border-red-500 focus:ring-red-500/20"
                : "border-slate-300 focus:border-blue-600 focus:ring-blue-600/20 dark:border-slate-800"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label={showNewPassword ? "Hide password" : "Show password"}
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.newPassword && (
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            {errors.newPassword.message}
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Confirm New Password
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Lock className="h-4 w-4" />
          </div>
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            aria-invalid={errors.confirmPassword ? "true" : "false"}
            {...register("confirmPassword")}
            className={`w-full rounded-md border bg-white py-2 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 dark:bg-slate-950 dark:text-slate-100 ${
              errors.confirmPassword
                ? "border-red-500 focus:ring-red-500/20"
                : "border-slate-300 focus:border-blue-600 focus:ring-blue-600/20 dark:border-slate-800"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={resetPasswordMutation.isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors"
      >
        {resetPasswordMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Resetting Password...
          </span>
        ) : (
          "Reset Password"
        )}
      </Button>

      <div className="flex items-center justify-between text-xs pt-2">
        <Link
          href="/forgot-password"
          className="text-blue-600 hover:underline font-medium dark:text-blue-400"
        >
          Need a new OTP?
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Sign In
        </Link>
      </div>
    </form>
  );
}
