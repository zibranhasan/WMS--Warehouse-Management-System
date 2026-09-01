"use client";

import { useForm, Controller } from "react-hook-form";
import { useBins } from "@/features/bin/bin.hooks";
import { InventoryLocationStock, TransferStockPayload } from "../inventory.types";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRightLeft } from "lucide-react";

interface StockTransferDialogProps {
  locationStock: InventoryLocationStock | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: TransferStockPayload) => Promise<void>;
  isPending: boolean;
}

export function StockTransferDialog({
  locationStock,
  isOpen,
  onClose,
  onSubmit,
  isPending,
}: StockTransferDialogProps) {
  const currentQty = locationStock ? Number(locationStock.quantity) : 0;
  const fromBin = locationStock?.bin;
  const fromBinName = fromBin ? `${fromBin.name} (${fromBin.code})` : "-";
  const productName = locationStock?.product ? `${locationStock.product.name} (SKU: ${locationStock.product.sku})` : "-";

  // Fetch active destination bins in the same warehouse
  const { data: binsData, isLoading: isLoadingBins } = useBins(
    locationStock?.warehouseId
      ? { warehouseId: locationStock.warehouseId, limit: 300, status: "ACTIVE" }
      : undefined
  );
  const bins = binsData?.data || [];
  // Exclude source bin from destination options
  const destinationBins = bins.filter((b) => b.id !== locationStock?.binId);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TransferStockPayload>({
    defaultValues: {
      warehouseId: locationStock?.warehouseId || "",
      productId: locationStock?.productId || "",
      fromBinId: locationStock?.binId || "",
      toBinId: "",
      quantity: 1,
      reason: "",
      reference: "",
    },
  });

  const onFormSubmit = async (values: TransferStockPayload) => {
    if (!locationStock) return;

    await onSubmit({
      warehouseId: locationStock.warehouseId,
      productId: locationStock.productId,
      fromBinId: locationStock.binId,
      toBinId: values.toBinId,
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
      title="Bin-to-Bin Stock Transfer"
      description="Relocate product inventory directly between two physical storage bins within the same warehouse."
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Context Banner */}
        <div className="rounded-lg border border-indigo-200 bg-indigo-50/70 p-3 text-xs dark:border-indigo-900/50 dark:bg-indigo-950/40 space-y-1">
          <p className="font-semibold text-indigo-900 dark:text-indigo-200">
            Product: <span className="font-normal">{productName}</span>
          </p>
          <div className="flex items-center gap-2 font-semibold text-indigo-900 dark:text-indigo-200">
            <span>Source Bin: {fromBinName}</span>
            <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-mono text-indigo-950 dark:text-indigo-100">Qty: {currentQty}</span>
          </div>
        </div>

        {/* Destination Bin Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Destination Storage Bin <span className="text-red-500">*</span>
          </label>
          {isLoadingBins ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Loading destination bins...</span>
            </div>
          ) : (
            <Controller
              name="toBinId"
              control={control}
              rules={{
                required: "Destination bin is required.",
                validate: (val) => val !== locationStock.binId || "Source and destination bin must be different.",
              }}
              render={({ field }) => (
                <select
                  {...field}
                  disabled={isPending}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">-- Select Destination Storage Bin --</option>
                  {destinationBins.map((b) => {
                    const shelf = b.shelf;
                    const aisle = shelf?.aisle;
                    const zone = aisle?.zone;
                    const label = [
                      `Bin: ${b.name} (${b.code})`,
                      shelf ? `Shelf: ${shelf.name}` : null,
                      aisle ? `Aisle: ${aisle.name}` : null,
                      zone ? `Zone: ${zone.name}` : null,
                    ]
                      .filter(Boolean)
                      .join(" — ");

                    return (
                      <option key={b.id} value={b.id}>
                        {label} (Cap: {b.capacity})
                      </option>
                    );
                  })}
                </select>
              )}
            />
          )}
          {errors.toBinId && (
            <p className="mt-1 text-[11px] text-red-500">{errors.toBinId.message}</p>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Quantity to Transfer <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            max={currentQty}
            step="any"
            {...register("quantity", {
              required: "Quantity is required.",
              min: { value: 1, message: "Quantity must be greater than zero." },
              max: { value: currentQty, message: `Cannot transfer more than source quantity (${currentQty}).` },
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
              placeholder="e.g. Bin replenishment"
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
              placeholder="e.g. TRANSFER-1004"
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex items-center gap-1.5"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirm Transfer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
