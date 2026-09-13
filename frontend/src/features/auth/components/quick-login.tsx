"use client";

import { useRouter } from "next/navigation";
import {
  Loader2,
  Package,
  Warehouse,
  Receipt,
  User,
  Shield,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLogin } from "../auth.hooks";

interface QuickAccount {
  email: string;
  password: string;
  role: string;
  warehouse?: string;
}

interface WarehouseGroup {
  warehouse: string;
  accounts: QuickAccount[];
}

const quickAccounts: WarehouseGroup[] = [
  {
    warehouse: "Dhaka Central Warehouse",
    accounts: [
      {
        email: "developmentpurpose3389@gmail.com",
        password: "Zibran123456789",
        role: "Procurement",
        warehouse: "Dhaka Central",
      },
      {
        email: "researchpurpose3389@gmail.com",
        password: "Zibran123456789",
        role: "Warehouse Manager",
        warehouse: "Dhaka Central",
      },
      {
        email: "mohammadzibranhasan@gmail.com",
        password: "Zibran123456789",
        role: "Finance",
        warehouse: "Dhaka Central",
      },
      {
        email: "zibranhasan3389@gmail.com",
        password: "Zibran123456789",
        role: "Staff",
        warehouse: "Dhaka Central",
      },
    ],
  },
  {
    warehouse: "Chittagong Warehouse",
    accounts: [
      {
        email: "researchpurpose23389@gmail.com",
        password: "Zibran123456789",
        role: "Procurement",
        warehouse: "Chittagong",
      },
      {
        email: "zibranhasansourav3389@gmail.com",
        password: "Zibran123456789",
        role: "Warehouse Manager",
        warehouse: "Chittagong",
      },
      {
        email: "researchpurpose33389@gmail.com",
        password: "Zibran123456789",
        role: "Staff",
        warehouse: "Chittagong",
      },
    ],
  },
  {
    warehouse: "Global",
    accounts: [
      {
        email: "zibranhasansourab@gmail.com",
        password: "Zibran123456789",
        role: "Admin",
      },
    ],
  },
];

function getRoleIcon(role: string) {
  switch (role) {
    case "Procurement":
      return Package;
    case "Warehouse Manager":
      return Warehouse;
    case "Finance":
      return Receipt;
    case "Staff":
      return User;
    case "Admin":
      return Shield;
    default:
      return User;
  }
}

export function QuickLogin() {
  const router = useRouter();
  const loginMutation = useLogin();

  const handleQuickLogin = (account: QuickAccount) => {
    loginMutation.mutate(
      { email: account.email, password: account.password },
      {
        onSuccess: () => {
          router.push("/dashboard");
        },
      }
    );
  };

  if (loginMutation.isPending) {
    return (
      <div className="mt-6 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Signing in...
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            Quick Login
          </span>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
        Select an account to continue
      </p>

      <div className="mt-4 space-y-5">
        {quickAccounts.map((group) => (
          <div key={group.warehouse}>
            <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {group.warehouse === "Global" ? "Global Access" : group.warehouse}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {group.accounts.map((account) => {
                const RoleIcon = getRoleIcon(account.role);
                return (
                  <Button
                    key={account.email}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickLogin(account)}
                    disabled={loginMutation.isPending}
                    className="flex h-auto min-h-[3.25rem] flex-col items-start gap-0.5 whitespace-normal rounded-lg border-slate-200 bg-white px-3 py-2.5 text-left transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm focus-visible:border-blue-400 focus-visible:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-600 dark:hover:bg-blue-950/30 dark:focus-visible:ring-blue-400/30"
                  >
                    <div className="flex w-full items-center gap-1.5">
                      <RoleIcon className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                      <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {account.role}
                      </span>
                    </div>
                    {account.warehouse && (
                      <span className="pl-5 text-[10px] text-slate-400 dark:text-slate-500">
                        {account.warehouse}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}