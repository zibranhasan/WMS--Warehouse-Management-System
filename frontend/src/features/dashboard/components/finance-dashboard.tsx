import Link from "next/link";
import { DashboardMetrics } from "../dashboard.types";
import { Receipt, ShoppingCart, Truck, ArrowRight, Loader2 } from "lucide-react";

interface FinanceDashboardProps {
  metrics?: DashboardMetrics;
  isLoading: boolean;
}

export function FinanceDashboard({ metrics, isLoading }: FinanceDashboardProps) {
  const cards = [
    {
      title: "Purchase Orders",
      value: metrics?.totalPurchaseOrders,
      icon: Receipt,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400",
      href: "/purchase-orders",
    },
    {
      title: "Sales Orders",
      value: metrics?.totalSalesOrders,
      icon: ShoppingCart,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400",
      href: "/sales-orders",
    },
    {
      title: "Active Suppliers",
      value: metrics?.totalSuppliers,
      icon: Truck,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400",
      href: "/suppliers",
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
                  View Module <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Financial & Order Oversight
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Review commercial purchase order receipts, sales orders, and vendor records.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link
            href="/purchase-orders"
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:border-blue-500 hover:bg-blue-50/50 dark:border-slate-800 transition"
          >
            <Receipt className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Purchase Orders</p>
              <p className="text-[10px] text-slate-500">Inbound procurement records</p>
            </div>
          </Link>
          <Link
            href="/sales-orders"
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:border-blue-500 hover:bg-blue-50/50 dark:border-slate-800 transition"
          >
            <ShoppingCart className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Sales Orders</p>
              <p className="text-[10px] text-slate-500">Customer fulfillments</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
