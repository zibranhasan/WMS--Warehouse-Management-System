"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { loginSchema, LoginSchemaType } from "../auth.schema";
import { useLogin } from "../auth.hooks";
import { ApiError } from "@/lib/api/api-error";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginSchemaType) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        router.push("/dashboard");
      },
    });
  };

  const getErrorMessage = (): string | null => {
    if (!loginMutation.error) return null;
    if (loginMutation.error instanceof ApiError) {
      return loginMutation.error.message;
    }
    return loginMutation.error.message || "An unexpected error occurred during login";
  };

  const serverError = getErrorMessage();
  const isUnverifiedEmailError =
    serverError &&
    (serverError.toLowerCase().includes("email not verified") ||
      serverError.toLowerCase().includes("verify your email") ||
      serverError.toLowerCase().includes("unverified"));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <div className="font-medium">{serverError}</div>
            {isUnverifiedEmailError && (
              <div>
                <Link
                  href={`/verify-email?email=${encodeURIComponent(
                    getValues("email") || ""
                  )}`}
                  className="inline-flex items-center text-xs font-semibold text-blue-700 underline hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                >
                  Verify Email Now &rarr;
                </Link>
              </div>
            )}
          </div>
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
            placeholder="admin@example.com"
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

      {/* Password Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Forgot password?
          </Link>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Lock className="h-4 w-4" />
          </div>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            aria-invalid={errors.password ? "true" : "false"}
            {...register("password")}
            className={`w-full rounded-md border bg-white py-2 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 dark:bg-slate-950 dark:text-slate-100 ${
              errors.password
                ? "border-red-500 focus:ring-red-500/20"
                : "border-slate-300 focus:border-blue-600 focus:ring-blue-600/20 dark:border-slate-800"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loginMutation.isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors"
      >
        {loginMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </span>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
}
