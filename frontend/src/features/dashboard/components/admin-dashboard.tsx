import Link from "next/link";
import { DashboardMetrics } from "../dashboard.types";
import { FolderTree, Package, Warehouse, Receipt, Users, ArrowRight, Loader2 } from "lucide-react";

interface AdminDashboardProps {
  metrics?: DashboardMetrics;
  isLoading: boolean;
}

export function AdminDashboard({ metrics, isLoading }: AdminDashboardProps) {
  const cards = [
    {
      title: "Total Categories",
      value: metrics?.totalCategories,
      icon: FolderTree,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400",
      href: "/categories",
    },
    {
      title: "Total Products",
      value: metrics?.totalProducts,
      icon: Package,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400",
      href: "/products",
    },
    {
      title: "Warehouses",
      value: metrics?.totalWarehouses,
      icon: Warehouse,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400",
      href: "/warehouses",
    },
    {
      title: "Pending Purchase Orders",
      value: metrics?.pendingPurchaseOrders,
      icon: Receipt,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400",
      href: "/purchase-orders",
    },
    {
      title: "System Users",
      value: metrics?.totalUsers,
      icon: Users,
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400",
      href: "/users",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View Module <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Operational Overview Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          System Quick Shortcuts & Master Data Management
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          As Administrator, you have full security privileges over master records, category management, warehouse structures, and user access roles.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <Link
            href="/categories"
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:border-blue-500 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:border-blue-900 transition"
          >
            <FolderTree className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Categories</p>
              <p className="text-[10px] text-slate-500">Manage category catalog</p>
            </div>
          </Link>
          <Link
            href="/products"
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:border-blue-500 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:border-blue-900 transition"
          >
            <Package className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Products</p>
              <p className="text-[10px] text-slate-500">View SKU & product master</p>
            </div>
          </Link>
          <Link
            href="/warehouses"
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:border-blue-500 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:border-blue-900 transition"
          >
            <Warehouse className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Warehouses</p>
              <p className="text-[10px] text-slate-500">Warehouse physical locations</p>
            </div>
          </Link>
          <Link
            href="/users"
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:border-blue-500 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:border-blue-900 transition"
          >
            <Users className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">User Accounts</p>
              <p className="text-[10px] text-slate-500">Staff roles & permissions</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
