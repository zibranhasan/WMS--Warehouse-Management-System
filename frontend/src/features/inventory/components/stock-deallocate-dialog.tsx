"use client";

import { useForm } from "react-hook-form";
import { DeallocateStockPayload, InventoryLocationStock } from "../inventory.types";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface StockDeallocateDialogProps {
  locationStock: InventoryLocationStock | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: DeallocateStockPayload) => Promise<void>;
  isPending: boolean;
}

export function StockDeallocateDialog({
  locationStock,
  isOpen,
  onClose,
  onSubmit,
  isPending,
}: StockDeallocateDialogProps) {
  const currentQty = locationStock ? Number(locationStock.quantity) : 0;
  const binName = locationStock?.bin ? `${locationStock.bin.name} (${locationStock.bin.code})` : "-";
  const productName = locationStock?.product ? `${locationStock.product.name} (SKU: ${locationStock.product.sku})` : "-";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeallocateStockPayload>({
    defaultValues: {
      warehouseId: locationStock?.warehouseId || "",
      productId: locationStock?.productId || "",
      binId: locationStock?.binId || "",
      quantity: 1,
      reason: "",
      reference: "",
    },
  });

  const onFormSubmit = async (values: DeallocateStockPayload) => {
    if (!locationStock) return;

    await onSubmit({
      warehouseId: locationStock.warehouseId,
      productId: locationStock.productId,
      binId: locationStock.binId,
      quantity: Number(values.quantity),
      reason: values.reason || undefined,
      reference: values.reference || undefined,
    });
    reset();
  };

  if (!locationStock) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Deallocate Stock from Bin"
      description="Remove allocated product stock from a bin and return it to the unallocated warehouse inventory pool."
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Context Summary Card */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs dark:border-amber-900/50 dark:bg-amber-950/40 space-y-1">
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            Product: <span className="font-normal">{productName}</span>
          </p>
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            Source Bin: <span className="font-normal">{binName}</span>
          </p>
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            Current Allocated Qty in Bin: <span className="font-mono font-bold text-amber-950 dark:text-amber-100">{currentQty}</span>
          </p>
        </div>

        {/* Quantity to Deallocate */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Quantity to Deallocate <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            max={currentQty}
            step="any"
            {...register("quantity", {
              required: "Quantity is required.",
              min: { value: 1, message: "Quantity must be greater than zero." },
              max: { value: currentQty, message: `Cannot deallocate more than current bin quantity (${currentQty}).` },
            })}
            disabled={isPending}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
          {errors.quantity && (
            <p className="mt-1 text-[11px] text-red-500">{errors.quantity.message}</p>
          )}
        </div>

        {/* Reason & Reference */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason (Optional)
            </label>
            <input
              type="text"
              {...register("reason")}
              placeholder="e.g. Return to unallocated pool"
              disabled={isPending}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reference (Optional)
            </label>
            <input
              type="text"
              {...register("reference")}
              placeholder="e.g. DEALLOC-1004"
              disabled={isPending}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs flex items-center gap-1.5"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirm Deallocation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
