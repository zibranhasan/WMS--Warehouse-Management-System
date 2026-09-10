"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useAddPackageItems } from "../packing.hooks";
import type { PackingTask, Package } from "../packing.types";
import { Modal } from "@/components/shared/modal";
import { StatusBadge } from "@/components/shared/status-badge";
import { PackingStatusBadge } from "./packing-status-badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/api-error";
import {
  Loader2,
  PackageCheck,
  AlertCircle,
  CheckCircle2,
  Plus,
  X,
  Boxes,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface AddPackageItemsDialogProps {
  packingTask: PackingTask | null;
  selectedPackage: Package | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const PACKAGE_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "success" | "warning" | "destructive" | "info" | "neutral" }
> = {
  OPEN: { label: "Open", variant: "warning" },
  PACKED: { label: "Packed", variant: "success" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function AddPackageItemsDialog({
  packingTask,
  selectedPackage,
  isOpen,
  onOpenChange,
}: AddPackageItemsDialogProps) {
  const addItemsMutation = useAddPackageItems();

  // Track selected items: packingTaskItemId -> quantity
  const [selectedItems, setSelectedItems] = useState<
    Record<string, number>
  >({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedItems({});
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Items with remaining quantity > 0
  const selectableItems = useMemo(() => {
    if (!packingTask) return [];
    return packingTask.items.filter((item) => item.remainingQuantity > 0);
  }, [packingTask]);

  // All items fully packed
  const allFullyPacked = packingTask
    ? packingTask.items.length > 0 && selectableItems.length === 0
    : false;

  // Selected entries as array
  const selectedEntries = useMemo(() => {
    return Object.entries(selectedItems).filter(([, qty]) => qty > 0);
  }, [selectedItems]);

  const hasValidSelection = selectedEntries.length > 0;

  const handleToggleItem = useCallback(
    (itemId: string) => {
      setSelectedItems((prev) => {
        const next = { ...prev };
        if (itemId in next) {
          delete next[itemId];
        } else {
          next[itemId] = 1;
        }
        return next;
      });
      setErrorMessage(null);
    },
    []
  );

  const handleQuantityChange = useCallback(
    (itemId: string, value: string) => {
      const num = parseInt(value, 10);
      setSelectedItems((prev) => {
        if (isNaN(num) || num <= 0) {
          const next = { ...prev };
          delete next[itemId];
          return next;
        }
        return { ...prev, [itemId]: num };
      });
      setErrorMessage(null);
    },
    []
  );

  const handleSubmit = async () => {
    if (!packingTask || !selectedPackage || !hasValidSelection) return;

    setErrorMessage(null);

    const payload = {
      items: selectedEntries.map(([packingTaskItemId, quantity]) => ({
        packingTaskItemId,
        quantity,
      })),
    };

    try {
      await addItemsMutation.mutateAsync({
        id: packingTask.id,
        packageId: selectedPackage.id,
        payload,
      });
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An error occurred while adding items to the package.");
      }
    }
  };

  const handleClose = useCallback(() => {
    setSelectedItems({});
    setErrorMessage(null);
    onOpenChange(false);
  }, [onOpenChange]);

  const isSubmitting = addItemsMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Package Items"
      description={selectedPackage?.packageNumber}
      maxWidthClass="max-w-2xl"
      className="max-h-[90vh] flex flex-col"
      contentClassName="min-h-0 flex-1 overflow-y-auto space-y-3"
    >
      <div className="space-y-4">
        {/* Package & Task Info */}
        {selectedPackage && packingTask && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Package
                </span>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Boxes className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                  <span className="font-medium text-slate-900 dark:text-white">
                    {selectedPackage.packageNumber}
                  </span>
                  <StatusBadge
                    label={
                      PACKAGE_STATUS_CONFIG[selectedPackage.status]?.label ??
                      selectedPackage.status
                    }
                    variant={
                      PACKAGE_STATUS_CONFIG[selectedPackage.status]?.variant ??
                      "neutral"
                    }
                  />
                </div>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Packing Task
                </span>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <PackageCheck className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                  <span className="font-medium text-slate-900 dark:text-white">
                    {packingTask.packingNumber}
                  </span>
                  <PackingStatusBadge status={packingTask.status} />
                </div>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Sales Order
                </span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {packingTask.salesOrder?.orderNumber ?? "\u2014"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Warehouse
                </span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {packingTask.warehouse?.name ?? "\u2014"}
                </p>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              Items will be added to this package.
            </p>
          </div>
        )}

        {/* Error */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* All items fully packed */}
        {allFullyPacked && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-800">
            <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-green-500 dark:text-green-400" />
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              All items are fully packed.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              There are no remaining quantities to add to this package.
            </p>
          </div>
        )}

        {/* Items list */}
        {!allFullyPacked && packingTask && (
          <div>
            <p className="mb-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Available Items ({selectableItems.length})
            </p>
            <div className="space-y-2">
              {packingTask.items.map((item) => {
                const isSelected = item.id in selectedItems;
                const remaining = item.remainingQuantity;
                const isFullyPacked = remaining <= 0;
                const enteredQty = selectedItems[item.id] ?? 0;
                const exceedsRemaining = enteredQty > remaining;

                return (
                  <div
                    key={item.id}
                    className={`rounded-lg border p-3 transition-colors ${
                      isFullyPacked
                        ? "border-slate-200 bg-slate-50 opacity-60 dark:border-slate-700 dark:bg-slate-900"
                        : isSelected
                          ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30"
                          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {item.product?.name || item.productId}
                          {item.product?.sku && (
                            <span className="ml-1 text-slate-400 dark:text-slate-500">
                              ({item.product.sku})
                            </span>
                          )}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Required: {item.requiredQuantity}</span>
                          <span>Packed: {item.packedQuantity}</span>
                          <span
                            className={
                              isFullyPacked
                                ? "font-medium text-green-600 dark:text-green-400"
                                : "font-medium text-amber-600 dark:text-amber-400"
                            }
                          >
                            Remaining: {remaining}
                          </span>
                        </div>
                        {isFullyPacked && (
                          <span className="mt-1 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            FULLY PACKED
                          </span>
                        )}
                      </div>

                      {!isFullyPacked && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleItem(item.id)}
                            className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
                              isSelected
                                ? "border-blue-500 bg-blue-600 text-white"
                                : "border-slate-300 bg-white text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-800"
                            }`}
                            aria-label={
                              isSelected
                                ? `Deselect ${item.product?.name || item.productId}`
                                : `Select ${item.product?.name || item.productId}`
                            }
                          >
                            {isSelected ? (
                              <X className="h-3.5 w-3.5" />
                            ) : (
                              <Plus className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Quantity input for selected item */}
                    {isSelected && !isFullyPacked && (
                      <div className="mt-2.5 border-t border-blue-200 pt-2.5 dark:border-blue-800">
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-300">
                              Quantity to add{" "}
                              <span className="text-slate-400 dark:text-slate-500">
                                (max {remaining})
                              </span>
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={remaining}
                              step={1}
                              value={selectedItems[item.id] ?? ""}
                              onChange={(e) =>
                                handleQuantityChange(item.id, e.target.value)
                              }
                              placeholder="0"
                              disabled={isSubmitting}
                              className={`w-full rounded-md border bg-white px-2.5 py-1.5 text-sm text-slate-900 dark:bg-slate-900 dark:text-slate-100 ${
                                exceedsRemaining
                                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                  : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-600"
                              } focus:outline-none focus:ring-2 disabled:opacity-50`}
                            />
                          </div>
                        </div>
                        {exceedsRemaining && (
                          <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                            Quantity cannot exceed remaining ({remaining}).
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary */}
        {hasValidSelection && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5 text-xs dark:border-blue-800 dark:bg-blue-950/30">
            <p className="font-medium text-blue-700 dark:text-blue-300">
              {selectedEntries.length} item{selectedEntries.length !== 1 ? "s" : ""} selected
              {" \u2014 "}total quantity:{" "}
              {selectedEntries.reduce((sum, [, qty]) => sum + qty, 0)}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 pt-3 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !hasValidSelection || allFullyPacked}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Adding Items...
              </>
            ) : (
              "Add Items"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
