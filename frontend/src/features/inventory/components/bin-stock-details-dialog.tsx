"use client";

import { useBinStock } from "../inventory.hooks";
import { Modal } from "@/components/shared/modal";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { Loader2, Box, Grid, Columns, Layers, Building2, Package } from "lucide-react";

interface BinStockDetailsDialogProps {
  binId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BinStockDetailsDialog({
  binId,
  isOpen,
  onClose,
}: BinStockDetailsDialogProps) {
  const { data, isLoading, isError, error, refetch } = useBinStock(binId || undefined);
  const details = data?.data;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bin Stock & Capacity Details"
    >
      <div className="space-y-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <p className="text-xs text-slate-500">Loading bin stock details...</p>
          </div>
        )}

        {isError && (
          <PageErrorAlert
            title="Error loading bin details"
            message={error instanceof Error ? error.message : "Failed to load bin stock."}
            onRetry={refetch}
          />
        )}

        {!isLoading && !isError && details && (
          <div className="space-y-4">
            {/* Header info */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Box className="h-4 w-4 text-emerald-500" />
                  Bin: {details.bin.name} ({details.bin.code})
                </span>
                <span className="font-mono text-[11px] text-slate-500 uppercase">
                  Status: {details.bin.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                {details.warehouse && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-slate-400" />
                    {details.warehouse.name}
                  </span>
                )}
                {details.zone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3 text-indigo-500" />
                      {details.zone.name}
                    </span>
                  </>
                )}
                {details.aisle && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Columns className="h-3 w-3 text-blue-500" />
                      {details.aisle.name}
                    </span>
                  </>
                )}
                {details.shelf && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Grid className="h-3 w-3 text-amber-500" />
                      {details.shelf.name}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Capacity Cards */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Total Capacity</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{details.capacity}</p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-2 dark:border-blue-900/50 dark:bg-blue-950/40">
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Used Capacity</span>
                <p className="font-mono font-bold text-blue-900 dark:text-blue-200 mt-0.5">{details.usedCapacity}</p>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2 dark:border-emerald-900/50 dark:bg-emerald-950/40">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Available</span>
                <p className="font-mono font-bold text-emerald-900 dark:text-emerald-200 mt-0.5">{details.availableCapacity}</p>
              </div>
            </div>

            {/* Stored Products List */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-blue-500" />
                Products Inside Bin ({details.products.length})
              </h5>

              {details.products.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                  This bin is currently empty.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {details.products.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded border border-slate-200 bg-white text-xs dark:border-slate-800 dark:bg-slate-950"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {item.product.name}
                        </p>
                        <p className="font-mono text-[11px] text-slate-500">
                          SKU: {item.product.sku}
                        </p>
                      </div>

                      <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {Number(item.quantity)} {item.product.unit}
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
