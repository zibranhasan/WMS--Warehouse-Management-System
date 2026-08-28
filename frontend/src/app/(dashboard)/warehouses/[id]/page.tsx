"use client";

import { use } from "react";
import Link from "next/link";
import { useWarehouse } from "@/features/warehouse/warehouse.hooks";
import { WarehouseStatusBadge } from "@/features/warehouse/components/warehouse-status-badge";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, MapPin, Calendar, Globe } from "lucide-react";

interface WarehouseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function WarehouseDetailPage({ params }: WarehouseDetailPageProps) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const { data, isLoading, isError, error, refetch } = useWarehouse(id);
  const warehouse = data?.data;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link href="/warehouses">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Warehouses
          </Button>
        </Link>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="animate-pulse space-y-6">
          <div className="h-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-64 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <PageErrorAlert
          title="Error loading warehouse detail"
          message={
            error instanceof Error ? error.message : "Failed to load warehouse."
          }
          onRetry={refetch}
        />
      )}

      {/* Detail Content */}
      {!isLoading && !isError && warehouse && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {warehouse.name}
                    </h1>
                    <WarehouseStatusBadge status={warehouse.status} />
                  </div>
                  <p className="mt-1 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Code: {warehouse.code}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Overview Details Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Information Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                Facility Information
              </h3>
              <dl className="space-y-3 text-xs">
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Code</dt>
                  <dd className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                    {warehouse.code}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Name</dt>
                  <dd className="font-medium text-slate-900 dark:text-white mt-0.5">
                    {warehouse.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Description</dt>
                  <dd className="text-slate-700 dark:text-slate-300 mt-0.5">
                    {warehouse.description || "No description provided."}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Location & Metadata Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                Location & Timestamps
              </h3>
              <dl className="space-y-3 text-xs">
                <div>
                  <dt className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Street Address
                  </dt>
                  <dd className="font-medium text-slate-900 dark:text-white mt-0.5">
                    {warehouse.address || "—"}
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">City</dt>
                    <dd className="font-medium text-slate-900 dark:text-white mt-0.5">
                      {warehouse.city || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Country
                    </dt>
                    <dd className="font-medium text-slate-900 dark:text-white mt-0.5">
                      {warehouse.country || "—"}
                    </dd>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Created
                    </dt>
                    <dd className="text-slate-700 dark:text-slate-300 mt-0.5">
                      {formatDate(warehouse.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Last Updated
                    </dt>
                    <dd className="text-slate-700 dark:text-slate-300 mt-0.5">
                      {formatDate(warehouse.updatedAt)}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
