"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useProducts } from "@/features/product/product.hooks";
import { useWarehouses } from "@/features/warehouse/warehouse.hooks";
import { StockAdjustmentPayload } from "../inventory.types";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";

interface StockAdjustDialogProps {
  isOpen: boolean;
  defaultWarehouseId?: string;
  defaultProductId?: string;
  isWarehouseLocked?: boolean;
  isProductLocked?: boolean;
  onClose: () => void;
  onSubmit: (payload: StockAdjustmentPayload) => Promise<void>;
  isPending: boolean;
}

export function StockAdjustDialog({
  isOpen,
  defaultWarehouseId,
  defaultProductId,
  isWarehouseLocked = false,
  isProductLocked = false,
  onClose,
  onSubmit,
  isPending,
}: StockAdjustDialogProps) {
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
  } = useForm<StockAdjustmentPayload>({
    defaultValues: {
      warehouseId: defaultWarehouseId || "",
      productId: defaultProductId || "",
      type: "IN",
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
        type: "IN",
        quantity: 1,
        reason: "",
        reference: "",
      });
    }
  }, [isOpen, defaultWarehouseId, defaultProductId, reset]);

  const selectedType = watch("type");

  const onFormSubmit = async (values: StockAdjustmentPayload) => {
    await onSubmit({
      warehouseId: values.warehouseId,
      productId: values.productId,
      type: values.type,
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
      title="Warehouse Stock Adjustment"
      description="Record stock intake (IN), issue (OUT), or manual inventory count adjustment."
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

        {/* Movement Type Radio Cards */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Movement Type <span className="text-red-500">*</span>
          </label>
          <Controller
            name="type"
            control={control}
            rules={{ required: "Movement type is required." }}
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => field.onChange("IN")}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold transition ${
                    field.value === "IN"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-200"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  <ArrowDownLeft className="h-4 w-4 text-emerald-600 mb-1" />
                  <span>Stock IN</span>
                </button>

                <button
                  type="button"
                  onClick={() => field.onChange("OUT")}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold transition ${
                    field.value === "OUT"
                      ? "border-red-500 bg-red-50 text-red-900 dark:border-red-500 dark:bg-red-950/50 dark:text-red-200"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  <ArrowUpRight className="h-4 w-4 text-red-600 mb-1" />
                  <span>Stock OUT</span>
                </button>

                <button
                  type="button"
                  onClick={() => field.onChange("ADJUSTMENT")}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold transition ${
                    field.value === "ADJUSTMENT"
                      ? "border-amber-500 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-950/50 dark:text-amber-200"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  <RefreshCw className="h-4 w-4 text-amber-600 mb-1" />
                  <span>ADJUST</span>
                </button>
              </div>
            )}
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Quantity {selectedType === "ADJUSTMENT" ? "(Positive or Negative Delta)" : "(Greater than 0)"} <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="any"
            {...register("quantity", {
              required: "Quantity is required.",
              validate: (val) => {
                const num = Number(val);
                if (selectedType === "IN" || selectedType === "OUT") {
                  return num > 0 || "Quantity must be greater than zero for IN and OUT.";
                }
                if (selectedType === "ADJUSTMENT") {
                  return num !== 0 || "Quantity cannot be zero for ADJUSTMENT.";
                }
                return true;
              },
            })}
            disabled={isPending}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
          {errors.quantity && (
            <p className="mt-1 text-[11px] text-red-500">{errors.quantity.message}</p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Reason (Optional)
          </label>
          <input
            type="text"
            {...register("reason")}
            placeholder="e.g. Initial stock intake, damaged goods, physical audit count..."
            disabled={isPending}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        {/* Reference */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Reference / Document No. (Optional)
          </label>
          <input
            type="text"
            {...register("reference")}
            placeholder="e.g. PO-10042, AUDIT-2026-09"
            disabled={isPending}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
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
            Submit Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
