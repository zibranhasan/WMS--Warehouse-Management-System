"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { changePasswordSchema, ChangePasswordSchemaType } from "../auth.schema";
import { useChangePassword, authKeys } from "../auth.hooks";
import { authApi } from "../auth.api";
import { ApiError } from "@/lib/api/api-error";

export function ChangePasswordForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmittingSuccess, setIsSubmittingSuccess] = useState(false);

  const changePasswordMutation = useChangePassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordSchemaType>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordSchemaType) => {
    if (isSubmittingSuccess || changePasswordMutation.isPending) return;
    setSuccessMessage(null);

    try {
      const res = await changePasswordMutation.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      setIsSubmittingSuccess(true);
      setSuccessMessage(res.message || "Password changed successfully. Redirecting to dashboard...");

      // Invalidate currentUser query cache so React Query re-fetches latest user info
      await queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });

      // Perform window navigation to /dashboard so Next.js middleware validates fresh session cookies
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 800);
    } catch {
      setIsSubmittingSuccess(false);
    }
  };

  const getErrorMessage = (): string | null => {
    if (!changePasswordMutation.error) return null;
    if (changePasswordMutation.error instanceof ApiError) {
      return changePasswordMutation.error.message;
    }
    return (
      changePasswordMutation.error.message ||
      "An unexpected error occurred while changing password"
    );
  };

  const serverError = getErrorMessage();
  const isBusy = changePasswordMutation.isPending || isSubmittingSuccess;

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

      {/* Current Password Field */}
      <div className="space-y-2">
        <label
          htmlFor="currentPassword"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Current Password
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Lock className="h-4 w-4" />
          </div>
          <input
            id="currentPassword"
            type={showCurrentPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isBusy}
            aria-invalid={errors.currentPassword ? "true" : "false"}
            {...register("currentPassword")}
            className={`w-full rounded-md border bg-white py-2 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:opacity-50 dark:bg-slate-950 dark:text-slate-100 ${
              errors.currentPassword
                ? "border-red-500 focus:ring-red-500/20"
                : "border-slate-300 focus:border-blue-600 focus:ring-blue-600/20 dark:border-slate-800"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword((prev) => !prev)}
            disabled={isBusy}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
          >
            {showCurrentPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.currentPassword && (
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            {errors.currentPassword.message}
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
            disabled={isBusy}
            aria-invalid={errors.newPassword ? "true" : "false"}
            {...register("newPassword")}
            className={`w-full rounded-md border bg-white py-2 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:opacity-50 dark:bg-slate-950 dark:text-slate-100 ${
              errors.newPassword
                ? "border-red-500 focus:ring-red-500/20"
                : "border-slate-300 focus:border-blue-600 focus:ring-blue-600/20 dark:border-slate-800"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((prev) => !prev)}
            disabled={isBusy}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label={showNewPassword ? "Hide new password" : "Show new password"}
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
            disabled={isBusy}
            aria-invalid={errors.confirmPassword ? "true" : "false"}
            {...register("confirmPassword")}
            className={`w-full rounded-md border bg-white py-2 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:opacity-50 dark:bg-slate-950 dark:text-slate-100 ${
              errors.confirmPassword
                ? "border-red-500 focus:ring-red-500/20"
                : "border-slate-300 focus:border-blue-600 focus:ring-blue-600/20 dark:border-slate-800"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            disabled={isBusy}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
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
        disabled={isBusy}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors"
      >
        {isBusy ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating Password...
          </span>
        ) : (
          "Change Password"
        )}
      </Button>
    </form>
  );
}

