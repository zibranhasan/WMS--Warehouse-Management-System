"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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
          <span className="bg-white px-2 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            Quick Login
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {quickAccounts.map((group) => (
          <div key={group.warehouse}>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              {group.warehouse}
            </h3>
            <div className="flex flex-wrap gap-2">
              {group.accounts.map((account) => (
                <Button
                  key={account.email}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin(account)}
                  disabled={loginMutation.isPending}
                  className="flex flex-col items-start h-auto py-2 px-3"
                >
                  <span className="font-medium text-xs">{account.role}</span>
                  {account.warehouse && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {account.warehouse}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}