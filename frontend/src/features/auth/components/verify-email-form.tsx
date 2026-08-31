"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  verifyEmailSchema,
  VerifyEmailSchemaType,
  sendVerificationOtpSchema,
} from "../email-verification.schema";
import {
  useSendVerificationOtp,
  useVerifyEmail,
} from "../email-verification.hooks";
import { ApiError } from "@/lib/api/api-error";

interface VerifyEmailFormProps {
  initialEmail?: string;
}

export function VerifyEmailForm({ initialEmail = "" }: VerifyEmailFormProps) {
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const verifyMutation = useVerifyEmail();
  const resendMutation = useSendVerificationOtp();

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm<VerifyEmailSchemaType>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: initialEmail,
      otp: "",
    },
  });

  // 60-second Resend countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const onSubmit = (data: VerifyEmailSchemaType) => {
    setSuccessMessage(null);
    setResendMessage(null);
    verifyMutation.mutate(
      {
        email: data.email,
        otp: data.otp,
      },
      {
        onSuccess: (res) => {
          setSuccessMessage(
            res.message || "Email verified successfully. Redirecting to sign in..."
          );
          setTimeout(() => {
            router.push("/login");
          }, 1500);
        },
      }
    );
  };

  const handleResendOtp = () => {
    setSuccessMessage(null);
    setResendMessage(null);
    const email = getValues("email");

    // Validate email before sending resend request
    const validation = sendVerificationOtpSchema.safeParse({ email });
    if (!validation.success) {
      setError("email", {
        type: "manual",
        message: validation.error.issues[0]?.message || "Valid email is required.",
      });
      return;
    }


    resendMutation.mutate(
      { email },
      {
        onSuccess: (res) => {
          setResendMessage(res.message || "Verification OTP sent successfully.");
          setCooldown(60);
        },
      }
    );
  };

  const getErrorMessage = (): string | null => {
    const err = verifyMutation.error || resendMutation.error;
    if (!err) return null;
    if (err instanceof ApiError) {
      return err.message;
    }
    return err.message || "An unexpected error occurred. Please try again.";
  };

  const serverError = getErrorMessage();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Error alert banner */}
      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <div className="flex-1 font-medium">{serverError}</div>
        </div>
      )}

      {/* Verification success alert banner */}
      {successMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
        </div>
      )}

      {/* Resend success alert banner */}
      {resendMessage && !successMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-300"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1 font-medium">{resendMessage}</div>
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
            placeholder="user@example.com"
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

      {/* 6-Digit OTP Field */}
      <div className="space-y-2">
        <label
          htmlFor="otp"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          6-Digit Verification Code
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <KeyRound className="h-4 w-4" />
          </div>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
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

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={verifyMutation.isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors"
      >
        {verifyMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying Code...
          </span>
        ) : (
          "Verify Email"
        )}
      </Button>

      {/* Resend & Back links */}
      <div className="flex flex-col items-center gap-3 pt-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <span>Didn&apos;t receive the code?</span>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendMutation.isPending || cooldown > 0}
            className="font-semibold text-blue-600 hover:underline disabled:opacity-50 disabled:no-underline dark:text-blue-400 flex items-center gap-1"
          >
            {resendMutation.isPending && (
              <RefreshCw className="h-3 w-3 animate-spin" />
            )}
            {cooldown > 0 ? `Resend OTP (${cooldown}s)` : "Resend OTP"}
          </button>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Sign In
        </Link>
      </div>
    </form>
  );
}
