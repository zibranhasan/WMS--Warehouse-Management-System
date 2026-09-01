"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useProducts } from "@/features/product/product.hooks";
import { useWarehouses } from "@/features/warehouse/warehouse.hooks";
import { useBins } from "@/features/bin/bin.hooks";
import { AllocateStockPayload } from "../inventory.types";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface StockAllocateDialogProps {
  isOpen: boolean;
  defaultWarehouseId?: string;
  defaultProductId?: string;
  defaultBinId?: string;
  isWarehouseLocked?: boolean;
  isProductLocked?: boolean;
  isBinLocked?: boolean;
  onClose: () => void;
  onSubmit: (payload: AllocateStockPayload) => Promise<void>;
  isPending: boolean;
}

export function StockAllocateDialog({
  isOpen,
  defaultWarehouseId,
  defaultProductId,
  defaultBinId,
  isWarehouseLocked = false,
  isProductLocked = false,
  isBinLocked = false,
  onClose,
  onSubmit,
  isPending,
}: StockAllocateDialogProps) {
  const { data: warehousesData, isLoading: isLoadingWarehouses } = useWarehouses({
    limit: 100,
    status: "ACTIVE",
  });
  const warehouses = warehousesData?.data || [];

  const { data: productsData, isLoading: isLoadingProducts } = useProducts({
    limit: 200,
    status: "ACTIVE",
  });
  const products = productsData?.data || [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<AllocateStockPayload>({
    defaultValues: {
      warehouseId: defaultWarehouseId || "",
      productId: defaultProductId || "",
      binId: defaultBinId || "",
      quantity: 1,
      reason: "",
      reference: "",
    },
  });

  // Re-sync form state whenever modal is opened or default props change
  useEffect(() => {
    if (isOpen) {
      reset({
        warehouseId: defaultWarehouseId || "",
        productId: defaultProductId || "",
        binId: defaultBinId || "",
        quantity: 1,
        reason: "",
        reference: "",
      });
    }
  }, [isOpen, defaultWarehouseId, defaultProductId, defaultBinId, reset]);

  const selectedWarehouseId = watch("warehouseId");

  // Fetch active bins for selected warehouse
  const { data: binsData, isLoading: isLoadingBins } = useBins(
    selectedWarehouseId ? { warehouseId: selectedWarehouseId, limit: 300, status: "ACTIVE" } : undefined
  );
  const bins = binsData?.data || [];

  const onFormSubmit = async (values: AllocateStockPayload) => {
    await onSubmit({
      warehouseId: values.warehouseId,
      productId: values.productId,
      binId: values.binId,
      quantity: Number(values.quantity),
      reason: values.reason || undefined,
      reference: values.reference || undefined,
    });
    reset();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Allocate Stock to Bin"
      description="Assign unallocated warehouse inventory stock to a specific physical storage bin location."
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Warehouse Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Warehouse <span className="text-red-500">*</span>
          </label>
          {isLoadingWarehouses ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Loading active warehouses...</span>
            </div>
          ) : (
            <select
              {...register("warehouseId", { required: "Warehouse selection is required." })}
              disabled={isPending || isWarehouseLocked}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white disabled:opacity-75"
            >
              <option value="">-- Select Target Warehouse --</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          )}
          {errors.warehouseId && (
            <p className="mt-1 text-[11px] text-red-500">{errors.warehouseId.message}</p>
          )}
        </div>

        {/* Product Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Product <span className="text-red-500">*</span>
          </label>
          {isLoadingProducts ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Loading active products...</span>
            </div>
          ) : (
            <select
              {...register("productId", { required: "Product selection is required." })}
              disabled={isPending || isProductLocked}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white disabled:opacity-75"
            >
              <option value="">-- Select Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (SKU: {p.sku}) [{p.unit}]
                </option>
              ))}
            </select>
          )}
          {errors.productId && (
            <p className="mt-1 text-[11px] text-red-500">{errors.productId.message}</p>
          )}
        </div>

        {/* Destination Bin Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Destination Storage Bin <span className="text-red-500">*</span>
          </label>
          {!selectedWarehouseId ? (
            <p className="text-xs text-slate-400 italic">Please select a warehouse first.</p>
          ) : isLoadingBins ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Loading active bins in warehouse...</span>
            </div>
          ) : (
            <Controller
              name="binId"
              control={control}
              rules={{ required: "Destination bin selection is required." }}
              render={({ field }) => (
                <select
                  {...field}
                  disabled={isPending || isBinLocked}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white disabled:opacity-75"
                >
                  <option value="">-- Select Destination Storage Bin --</option>
                  {bins.map((b) => {
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
          {errors.binId && (
            <p className="mt-1 text-[11px] text-red-500">{errors.binId.message}</p>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Quantity to Allocate <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            step="any"
            {...register("quantity", {
              required: "Quantity is required.",
              min: { value: 1, message: "Quantity must be greater than zero." },
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
              placeholder="e.g. Putaway allocation"
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
              placeholder="e.g. ALLOC-1004"
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
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs flex items-center gap-1.5"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirm Allocation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
