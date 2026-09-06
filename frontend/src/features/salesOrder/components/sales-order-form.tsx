"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProducts } from "@/features/product/product.hooks";
import { useWarehouses } from "@/features/warehouse/warehouse.hooks";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { CreateSalesOrderPayload } from "../sales-order.types";
import {
  createSalesOrderSchema,
  CreateSalesOrderFormValues,
} from "../sales-order.schema";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/api-error";
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";

const GLOBAL_ROLES = ["SUPER_ADMIN", "ADMIN"];

interface SalesOrderFormProps {
  onSubmit: (values: CreateSalesOrderPayload) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

export function SalesOrderForm({
  onSubmit,
  onCancel,
  isPending,
}: SalesOrderFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateSalesOrderFormValues>({
    resolver: zodResolver(createSalesOrderSchema) as any,
    defaultValues: {
      warehouseId: "",
      notes: "",
      items: [{ productId: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");

  const { data: meData } = useCurrentUser();
  const user = meData?.data?.user;
  const isGlobalUser = GLOBAL_ROLES.includes(user?.role ?? "");

  const { data: warehousesData, isLoading: isLoadingWarehouses } = useWarehouses({
    limit: 200,
    status: "ACTIVE",
  });
  const allWarehouses = warehousesData?.data || [];

  const warehouses = useMemo(() => {
    if (isGlobalUser) return allWarehouses;
    return allWarehouses.filter((wh) => wh.id === user?.warehouseId);
  }, [isGlobalUser, allWarehouses, user?.warehouseId]);

  useEffect(() => {
    if (!isGlobalUser && user?.warehouseId && warehouses.length === 1) {
      setValue("warehouseId", user.warehouseId);
    }
  }, [isGlobalUser, user?.warehouseId, warehouses.length, setValue]);

  const { data: productsData, isLoading: isLoadingProducts } = useProducts({
    limit: 200,
    status: "ACTIVE",
  });
  const products = productsData?.data || [];

  const selectedProductIds = useMemo(() => {
    if (!watchedItems) return new Set<string>();
    return new Set(
      watchedItems.map((item) => item.productId).filter(Boolean)
    );
  }, [watchedItems]);

  const calculatedTotal = useMemo(() => {
    if (!watchedItems) return 0;
    return watchedItems.reduce(
      (sum, item) =>
        sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      0
    );
  }, [watchedItems]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const handleFormSubmit = async (values: CreateSalesOrderFormValues) => {
    setErrorMessage(null);
    try {
      const payload: CreateSalesOrderPayload = {
        warehouseId: values.warehouseId,
        notes: values.notes || undefined,
        items: values.items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      };
      await onSubmit(payload);
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

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit as any)}
      className="space-y-5 max-h-[80vh] overflow-y-auto pr-1"
    >
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Warehouse */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Warehouse <span className="text-red-500">*</span>
        </label>
        {isLoadingWarehouses ? (
          <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Loading warehouses...</span>
          </div>
        ) : (
          <select
            {...register("warehouseId", {
              required: "Warehouse is required.",
            })}
            disabled={isPending || (!isGlobalUser && warehouses.length === 1)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white disabled:opacity-60"
          >
            <option value="">-- Select Warehouse --</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>
        )}
        {errors.warehouseId && (
          <p className="text-[11px] text-red-500">
            {errors.warehouseId.message}
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Notes <span className="font-normal text-slate-500">(Optional)</span>
        </label>
        <textarea
          {...register("notes")}
          rows={2}
          placeholder="Additional notes or instructions..."
          disabled={isPending}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Order Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Order Items <span className="text-red-500">*</span>
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ productId: "", quantity: 1, unitPrice: 0 })
            }
            disabled={isPending}
            className="text-xs h-7 flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Item
          </Button>
        </div>

        {errors.items && !errors.items.root && (
          <p className="text-[11px] text-red-500">
            {errors.items.message}
          </p>
        )}
        {errors.items?.root && (
          <p className="text-[11px] text-red-500">
            {errors.items.root.message}
          </p>
        )}

        {isLoadingProducts ? (
          <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Loading products...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_100px_100px_36px]">
                  {/* Product */}
                  <div className="space-y-1">
                    <select
                      {...register(`items.${index}.productId`, {
                        required: "Product is required.",
                      })}
                      disabled={isPending}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:opacity-60"
                    >
                      <option value="">-- Select Product --</option>
                      {products.map((p) => (
                        <option
                          key={p.id}
                          value={p.id}
                          disabled={
                            selectedProductIds.has(p.id) &&
                            watchedItems?.[index]?.productId !== p.id
                          }
                        >
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                    {errors.items?.[index]?.productId && (
                      <p className="text-[11px] text-red-500">
                        {errors.items[index]?.productId?.message}
                      </p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      {...register(`items.${index}.quantity`, {
                        required: "Qty is required.",
                        min: { value: 1, message: "Min 1" },
                      })}
                      disabled={isPending}
                      placeholder="Qty"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:opacity-60"
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="text-[11px] text-red-500">
                        {errors.items[index]?.quantity?.message}
                      </p>
                    )}
                  </div>

                  {/* Unit Price */}
                  <div className="space-y-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      {...register(`items.${index}.unitPrice`, {
                        required: "Price is required.",
                        min: { value: 0.01, message: "Min 0.01" },
                      })}
                      disabled={isPending}
                      placeholder="Price"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:opacity-60"
                    />
                    {errors.items?.[index]?.unitPrice && (
                      <p className="text-[11px] text-red-500">
                        {errors.items[index]?.unitPrice?.message}
                      </p>
                    )}
                  </div>

                  {/* Remove Button */}
                  <div className="flex items-start justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={isPending || fields.length <= 1}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 h-9 w-9 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Line Total */}
                <div className="mt-2 text-right">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Line total:{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatCurrency(
                        (Number(watchedItems?.[index]?.quantity) || 0) *
                          (Number(watchedItems?.[index]?.unitPrice) || 0)
                      )}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div className="flex items-center justify-end rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <span className="text-xs text-slate-500 dark:text-slate-400 mr-3">
          Estimated Total:
        </span>
        <span className="text-lg font-bold text-slate-900 dark:text-white">
          {formatCurrency(calculatedTotal)}
        </span>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Create Sales Order
        </Button>
      </div>
    </form>
  );
}
