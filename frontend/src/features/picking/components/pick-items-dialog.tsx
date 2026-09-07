"use client";

import { useState, useMemo } from "react";
import { usePicking, usePickItems } from "../picking.hooks";
import { useProductLocations } from "@/features/inventory/inventory.hooks";
import type { PickingTaskItemDetail } from "../picking.types";
import { Modal } from "@/components/shared/modal";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { PickingStatusBadge } from "./picking-status-badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  PackageCheck,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface PickItemsDialogProps {
  pickingTaskId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const LOCATION_SEPARATOR = " > ";

function buildLocationPath(
  bin: { code?: string | null; name?: string | null } | null,
  shelf: { code?: string | null; name?: string | null } | null,
  aisle: { code?: string | null; name?: string | null } | null,
  zone: { code?: string | null; name?: string | null } | null
): string {
  const parts: string[] = [];
  if (zone) parts.push(zone.code || zone.name || "");
  if (aisle) parts.push(aisle.code || aisle.name || "");
  if (shelf) parts.push(shelf.code || shelf.name || "");
  if (bin) parts.push(bin.code || bin.name || "");
  return parts.filter(Boolean).join(LOCATION_SEPARATOR) || "\u2014";
}

// ---------------------------------------------------------------------------
// PickItemRow sub-component
// ---------------------------------------------------------------------------
function PickItemRow({
  item,
  pickingTaskId,
  warehouseId,
  onPickSuccess,
}: {
  item: PickingTaskItemDetail;
  pickingTaskId: string;
  warehouseId: string;
  onPickSuccess: () => void;
}) {
  const [selectedLocationStockId, setSelectedLocationStockId] =
    useState<string>("");
  const [quantity, setQuantity] = useState<string>("");

  const remainingQuantity = item.requiredQuantity - item.pickedQuantity;
  const isComplete = remainingQuantity <= 0;

  // Fetch available locations for this product
  const {
    data: locationsData,
    isLoading: locationsLoading,
    isError: locationsError,
  } = useProductLocations(item.productId);

  // Filter locations to only show those in the picking task's warehouse
  const availableLocations = useMemo(() => {
    if (!locationsData?.data?.warehouseLocations) return [];
    const warehouseGroup = locationsData.data.warehouseLocations.find(
      (wh) => wh.warehouse.id === warehouseId
    );
    return warehouseGroup?.locations ?? [];
  }, [locationsData, warehouseId]);

  // Pick mutation
  const pickMutation = usePickItems();

  const selectedLocation = availableLocations.find(
    (loc) => loc.id === selectedLocationStockId
  );

  const maxQuantity = Math.min(
    selectedLocation?.quantity ?? 0,
    remainingQuantity
  );

  const handlePick = async () => {
    if (!selectedLocationStockId || !quantity) return;

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return;

    await pickMutation.mutateAsync({
      id: pickingTaskId,
      payload: {
        items: [
          {
            pickingTaskItemId: item.id,
            locationStockId: selectedLocationStockId,
            quantity: qty,
          },
        ],
      },
    });

    // Reset form
    setSelectedLocationStockId("");
    setQuantity("");
    onPickSuccess();
  };

  if (isComplete) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {item.product?.name || item.productId}
                {item.product?.sku && (
                  <span className="ml-1 text-slate-400 dark:text-slate-500">
                    ({item.product.sku})
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Required: {item.requiredQuantity} | Picked: {item.pickedQuantity}{" "}
                | Remaining: 0
              </p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            PICKED
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
      {/* Item Header */}
      <div className="mb-3">
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          {item.product?.name || item.productId}
          {item.product?.sku && (
            <span className="ml-1 text-slate-400 dark:text-slate-500">
              ({item.product.sku})
            </span>
          )}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Required: {item.requiredQuantity} | Picked: {item.pickedQuantity} |{" "}
          <span className="font-medium text-amber-600 dark:text-amber-400">
            Remaining: {remainingQuantity}
          </span>
        </p>
      </div>

      {/* Location Loading */}
      {locationsLoading && (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading available locations...
        </div>
      )}

      {/* Location Error */}
      {locationsError && (
        <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-3 w-3" />
          Failed to load locations.
        </div>
      )}

      {/* No Locations */}
      {!locationsLoading && !locationsError && availableLocations.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <MapPin className="h-3 w-3" />
          No available stock locations.
        </div>
      )}

      {/* Pick Form */}
      {!locationsLoading && !locationsError && availableLocations.length > 0 && (
        <div className="space-y-2">
          {/* Location Select */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Select Location
            </label>
            <select
              value={selectedLocationStockId}
              onChange={(e) => {
                setSelectedLocationStockId(e.target.value);
                setQuantity("");
              }}
              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">Choose a location...</option>
              {availableLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {buildLocationPath(loc.bin, loc.shelf, loc.aisle, loc.zone)} —{" "}
                  Available: {loc.quantity}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity Input */}
          {selectedLocation && (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Quantity (Max: {maxQuantity})
                </label>
                <input
                  type="number"
                  min="0.01"
                  max={maxQuantity}
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handlePick}
                disabled={
                  !selectedLocationStockId ||
                  !quantity ||
                  parseFloat(quantity) <= 0 ||
                  parseFloat(quantity) > maxQuantity ||
                  pickMutation.isPending
                }
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {pickMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Pick"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function PickItemsDialog({
  pickingTaskId,
  isOpen,
  onOpenChange,
}: PickItemsDialogProps) {
  const { data, isLoading, isError, error, refetch } = usePicking(
    pickingTaskId || ""
  );

  const task = data?.data;

  // Calculate progress from items
  const totalRequired =
    task?.items.reduce((sum, i) => sum + i.requiredQuantity, 0) ?? 0;
  const totalPicked =
    task?.items.reduce((sum, i) => sum + i.pickedQuantity, 0) ?? 0;
  const progressPercent =
    totalRequired > 0
      ? Math.round((totalPicked / totalRequired) * 100)
      : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      title="Pick Items"
      description={task?.pickingNumber}
      maxWidthClass="max-w-2xl"
      className="max-h-[90vh] flex flex-col"
      contentClassName="min-h-0 flex-1 overflow-y-auto space-y-3"
    >
      <div>
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-400">
            <Loader2 className="mb-2 h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-medium">
              Fetching picking task details...
            </p>
          </div>
        )}

        {/* Error */}
        {isError && (
          <PageErrorAlert
            title="Failed to load picking task"
            message={
              error instanceof Error
                ? error.message
                : "An unexpected error occurred."
            }
            onRetry={refetch}
          />
        )}

        {/* Not Found */}
        {!isLoading && !isError && !task && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-400">
            <PackageCheck className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-medium">Picking task not found</p>
          </div>
        )}

        {/* Content */}
        {!isLoading && !isError && task && (
          <>
            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60">
                <PackageCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {task.pickingNumber}
                </h3>
                <div className="flex items-center gap-1.5">
                  <PickingStatusBadge status={task.status} />
                </div>
              </div>
            </div>

            {/* Progress */}
            {task.items.length > 0 && (
              <div>
                <p className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Picking Progress
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all dark:bg-blue-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium tabular-nums text-slate-600 dark:text-slate-400">
                    {totalPicked} / {totalRequired}
                  </span>
                </div>
              </div>
            )}

            {/* Items */}
            {task.items.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Items ({task.items.length})
                </p>
                {task.items.map((item) => (
                  <PickItemRow
                    key={item.id}
                    item={item}
                    pickingTaskId={pickingTaskId!}
                    warehouseId={task.warehouseId}
                    onPickSuccess={() => refetch()}
                  />
                ))}
              </div>
            )}

            {/* Items Empty */}
            {task.items.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center dark:border-slate-800">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  No items in this picking task.
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-slate-200 pt-2 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
