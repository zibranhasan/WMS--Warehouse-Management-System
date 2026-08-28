import Link from "next/link";
import { DashboardMetrics } from "../dashboard.types";
import { PackageCheck, PackageOpen, Send, ArrowRight, Loader2 } from "lucide-react";

interface StaffDashboardProps {
  metrics?: DashboardMetrics;
  isLoading: boolean;
}

export function StaffDashboard({ metrics, isLoading }: StaffDashboardProps) {
  const cards = [
    {
      title: "Pending Picking Tasks",
      value: metrics?.pendingPickingTasks,
      icon: PackageCheck,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400",
      href: "/picking",
    },
    {
      title: "Pending Packing Tasks",
      value: metrics?.pendingPackingTasks,
      icon: PackageOpen,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400",
      href: "/packing",
    },
    {
      title: "Active Shipments",
      value: metrics?.totalShipments,
      icon: Send,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400",
      href: "/shipping",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card, idx) => {
          const Icon = card.icon;

          return (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {card.title}
                </span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  ) : card.value !== undefined ? (
                    card.value
                  ) : (
                    <span className="text-xs font-normal text-slate-400 italic">N/A</span>
                  )}
                </p>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                <Link
                  href={card.href}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  View Queue <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Staff Operational Tasks & Dispatch
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Pick items from assigned bins, package goods, and update shipment dispatch statuses.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Link
            href="/picking"
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:border-blue-500 hover:bg-blue-50/50 dark:border-slate-800 transition"
          >
            <PackageCheck className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Picking Task Queue</p>
              <p className="text-[10px] text-slate-500">Pick item batches from bins</p>
            </div>
          </Link>
          <Link
            href="/packing"
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:border-blue-500 hover:bg-blue-50/50 dark:border-slate-800 transition"
          >
            <PackageOpen className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Packing Operations</p>
              <p className="text-[10px] text-slate-500">Pack items into containers</p>
            </div>
          </Link>
          <Link
            href="/shipping"
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:border-blue-500 hover:bg-blue-50/50 dark:border-slate-800 transition"
          >
            <Send className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Shipment Dispatch</p>
              <p className="text-[10px] text-slate-500">Mark ready for shipment</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
