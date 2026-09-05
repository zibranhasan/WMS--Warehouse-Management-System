import { Metadata } from "next";
import { Warehouse } from "lucide-react";
import { LoginForm } from "@/features/auth/components/login-form";
import { QuickLogin } from "@/features/auth/components/quick-login";

export const metadata: Metadata = {
  title: "Login | Warehouse Management System",
  description: "Sign in to access the Warehouse Management System dashboard.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 sm:px-6 lg:px-8 dark:bg-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
            <Warehouse className="h-7 w-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          WMS Portal
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600 dark:text-slate-400">
          Warehouse Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-6 py-8 shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl sm:px-10 dark:bg-slate-950 dark:ring-slate-800">
          <LoginForm />
          <QuickLogin />
        </div>
      </div>
    </div>
  );
}
