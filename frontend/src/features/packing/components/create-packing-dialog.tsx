"use client";

import { useState, useMemo } from "react";
import { useSalesOrders } from "@/features/salesOrder/sales-order.hooks";
import { usePickings } from "@/features/picking/picking.hooks";
import { useCreatePackingTask, usePackingTasks } from "../packing.hooks";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/api-error";
import { AlertCircle, Loader2 } from "lucide-react";

interface CreatePackingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreatePackingDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreatePackingDialogProps) {
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createMutation = useCreatePackingTask();

  // Fetch CONFIRMED Sales Orders (valid baseline for packing eligibility)
  const { data: soData, isLoading: isLoadingSOs } = useSalesOrders({
    status: "CONFIRMED",
    limit: 200,
  });

  // Fetch existing picking tasks to find SOs with PICKED status
  const { data: pickingData, isLoading: isLoadingPickings } = usePickings({
    limit: 200,
  });

  // Fetch existing packing tasks to exclude SOs that already have one
  const { data: packingData, isLoading: isLoadingPackings } = usePackingTasks({
    limit: 200,
  });

  // Build a Set of Sales Order IDs that already have a Packing Task
  const salesOrderIdsWithPacking = useMemo(() => {
    const tasks = packingData?.data ?? [];
    return new Set(tasks.map((t) => t.salesOrderId));
  }, [packingData?.data]);

  // Build a Map of Sales Order ID → PickingTask (for PICKED lookup)
  const pickingBySalesOrder = useMemo(() => {
    const tasks = pickingData?.data ?? [];
    const map = new Map<string, (typeof tasks)[number]>();
    for (const t of tasks) {
      if (t.status === "PICKED") {
        map.set(t.salesOrderId, t);
      }
    }
    return map;
  }, [pickingData?.data]);

  // Filter: only CONFIRMED SOs that have a PICKED PickingTask and no existing PackingTask
  const eligibleSalesOrders = useMemo(() => {
    const allSOs = soData?.data ?? [];
    return allSOs.filter(
      (so) =>
        pickingBySalesOrder.has(so.id) &&
        !salesOrderIdsWithPacking.has(so.id)
    );
  }, [soData?.data, pickingBySalesOrder, salesOrderIdsWithPacking]);

  const isLoading = isLoadingSOs || isLoadingPickings || isLoadingPackings;

  const selectedSO = useMemo(
    () => eligibleSalesOrders.find((so) => so.id === selectedSalesOrderId),
    [eligibleSalesOrders, selectedSalesOrderId]
  );

  const handleSubmit = async () => {
    if (!selectedSalesOrderId) return;

    setErrorMessage(null);
    try {
      await createMutation.mutateAsync({
        salesOrderId: selectedSalesOrderId,
      });
      setSelectedSalesOrderId("");
      onSuccess?.();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleClose = () => {
    setSelectedSalesOrderId("");
    setErrorMessage(null);
    onClose();
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Packing Task"
      description="Create a new packing task from a fully picked sales order."
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sales Order Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Sales Order <span className="text-red-500">*</span>
          </label>
          {isLoading ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Loading eligible sales orders...</span>
            </div>
          ) : (
            <select
              value={selectedSalesOrderId}
              onChange={(e) => setSelectedSalesOrderId(e.target.value)}
              disabled={createMutation.isPending}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white disabled:opacity-60"
            >
              <option value="">-- Select Sales Order --</option>
              {eligibleSalesOrders.map((so) => (
                <option key={so.id} value={so.id}>
                  {so.orderNumber} ({so.warehouse?.name ?? "N/A"}) —{" "}
                  {formatCurrency(so.totalAmount)}
                </option>
              ))}
            </select>
          )}
          {eligibleSalesOrders.length === 0 && !isLoading && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {soData?.data && soData.data.length > 0
                ? "No confirmed sales orders are fully picked and ready for packing."
                : "No confirmed sales orders available."}
            </p>
          )}
        </div>

        {/* Selected Order Context */}
        {selectedSO && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Order Number
                </span>
                <p className="font-mono font-medium text-slate-900 dark:text-white">
                  {selectedSO.orderNumber}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Warehouse
                </span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedSO.warehouse?.name ?? "\u2014"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Total Amount
                </span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {formatCurrency(selectedSO.totalAmount)}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Items
                </span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedSO.items?.length ?? 0}{" "}
                  {(selectedSO.items?.length ?? 0) === 1 ? "item" : "items"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={createMutation.isPending || !selectedSalesOrderId}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {createMutation.isPending && (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            Create Packing Task
          </Button>
        </div>
      </div>
    </Modal>
  );
}
