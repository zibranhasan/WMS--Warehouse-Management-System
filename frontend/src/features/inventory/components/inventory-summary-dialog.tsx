"use client";

import { useInventorySummary } from "../inventory.hooks";
import { Modal } from "@/components/shared/modal";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { Loader2, Boxes, Building2, Layers, Columns, Grid, Box } from "lucide-react";

interface InventorySummaryDialogProps {
  warehouseId: string | null;
  productId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InventorySummaryDialog({
  warehouseId,
  productId,
  isOpen,
  onClose,
}: InventorySummaryDialogProps) {
  const { data, isLoading, isError, error, refetch } = useInventorySummary(
    warehouseId || undefined,
    productId || undefined
  );

  const summary = data?.data;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Product Inventory Summary & Physical Locations"
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <p className="text-xs text-slate-500">Calculating inventory breakdown...</p>
          </div>
        )}

        {isError && (
          <PageErrorAlert
            title="Error loading summary"
            message={error instanceof Error ? error.message : "Failed to load summary."}
            onRetry={refetch}
          />
        )}

        {!isLoading && !isError && summary && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 shrink-0">
                  <Boxes className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {summary.product.name}
                  </h4>
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    SKU: {summary.product.sku} • Unit: {summary.product.unit}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-800 shrink-0">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span>{summary.warehouse.name} ({summary.warehouse.code})</span>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">Total Stock</span>
                <p className="font-mono text-base font-bold text-slate-900 dark:text-white mt-0.5">{summary.inventoryStock}</p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-2.5 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/40">
                <span className="text-[10px] font-semibold uppercase text-blue-600 dark:text-blue-400">Allocated</span>
                <p className="font-mono text-base font-bold text-blue-900 dark:text-blue-200 mt-0.5">{summary.allocatedStock}</p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-2.5 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40">
                <span className="text-[10px] font-semibold uppercase text-amber-600 dark:text-amber-400">Reserved</span>
                <p className="font-mono text-base font-bold text-amber-900 dark:text-amber-200 mt-0.5">{summary.reservedStock}</p>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/40">
                <span className="text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">Available</span>
                <p className="font-mono text-base font-bold text-emerald-900 dark:text-emerald-200 mt-0.5">{summary.availableStock}</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">Unallocated</span>
                <p className="font-mono text-base font-bold text-slate-700 dark:text-slate-300 mt-0.5">{summary.unallocatedStock}</p>
              </div>
            </div>

            {/* Physical Location Allocation List */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Box className="h-3.5 w-3.5 text-emerald-500" />
                Physical Bin Allocations ({summary.locations.length})
              </h5>

              {summary.locations.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500 dark:border-slate-800">
                  No stock is currently allocated to physical bins. All {summary.inventoryStock} units remain in bulk unallocated warehouse stock.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {summary.locations.map((loc) => (
                    <div
                      key={loc.locationStockId}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-800 dark:bg-slate-950"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
                          <Box className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          Bin: {loc.bin?.name} ({loc.bin?.code})
                        </span>

                        <span className="text-slate-400">•</span>

                        <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Grid className="h-3 w-3 text-amber-500" />
                          {loc.shelf?.name}
                        </span>

                        <span className="text-slate-400">•</span>

                        <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Columns className="h-3 w-3 text-blue-500" />
                          {loc.aisle?.name}
                        </span>

                        <span className="text-slate-400">•</span>

                        <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Layers className="h-3 w-3 text-indigo-500" />
                          {loc.zone?.name}
                        </span>
                      </div>

                      <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0 ml-2">
                        {loc.quantity} {summary.product.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
