"use client";

import { useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createZoneSchema,
  CreateZoneFormValues,
} from "../zone.schema";
import { CreateZonePayload, UpdateZonePayload, Zone } from "../zone.types";
import { useWarehouses } from "@/features/warehouse/warehouse.hooks";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const GLOBAL_ROLES = ["SUPER_ADMIN", "ADMIN"];

interface ZoneFormProps {
  initialData?: Zone | null;
  defaultWarehouseId?: string;
  onSubmit: (values: CreateZonePayload | UpdateZonePayload) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

export function ZoneForm({
  initialData,
  defaultWarehouseId,
  onSubmit,
  onCancel,
  isPending,
}: ZoneFormProps) {
  const isEditing = Boolean(initialData);

  const { data: meData, isLoading: isLoadingUser } = useCurrentUser();
  const user = meData?.data?.user;
  const isGlobalUser = GLOBAL_ROLES.includes(user?.role ?? "");

  // Fetch active warehouses for global /zones creation
  const { data: warehouseData, isLoading: isLoadingWarehouses } = useWarehouses({
    limit: 100,
    status: "ACTIVE",
  });
  const allWarehouses = warehouseData?.data || [];

  const warehouses = useMemo(() => {
    if (isGlobalUser) return allWarehouses;
    if (!user?.warehouseId) return [];
    return allWarehouses.filter((wh) => wh.id === user.warehouseId);
  }, [isGlobalUser, allWarehouses, user?.warehouseId]);

  const effectiveDefaultWarehouseId =
    initialData?.warehouseId ||
    defaultWarehouseId ||
    (!isGlobalUser && user?.warehouseId ? user.warehouseId : "");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateZoneFormValues>({
    resolver: zodResolver(createZoneSchema),
    defaultValues: {
      warehouseId: effectiveDefaultWarehouseId,
      code: initialData?.code || "",
      name: initialData?.name || "",
      description: initialData?.description || "",
      capacity: initialData?.capacity ?? 0,
    },
  });

  // Auto-select warehouse for scoped users in create mode
  useEffect(() => {
    if (!isEditing && !defaultWarehouseId && !isGlobalUser && user?.warehouseId) {
      setValue("warehouseId", user.warehouseId);
    }
  }, [isEditing, defaultWarehouseId, isGlobalUser, user?.warehouseId, setValue]);

  const onFormSubmit = async (values: CreateZoneFormValues) => {
    await onSubmit({
      warehouseId: values.warehouseId,
      code: values.code,
      name: values.name,
      description: values.description || undefined,
      capacity: Number(values.capacity),
    });
  };

  const isLoading = isLoadingWarehouses || isLoadingUser;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Warehouse Selection (Shown when defaultWarehouseId is not provided) */}
      {!defaultWarehouseId && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Warehouse <span className="text-red-500">*</span>
          </label>
          {isLoading ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Loading active warehouses...</span>
            </div>
          ) : (
            <select
              {...register("warehouseId")}
              disabled={isPending}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              {isGlobalUser ? (
                <option value="">-- Select Parent Warehouse --</option>
              ) : warehouses.length === 0 ? (
                <option value="">No warehouse assigned</option>
              ) : null}
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
      )}
      {/* Code */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Zone Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register("code")}
          placeholder="e.g. ZONE-A, Z-01"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
        {errors.code && (
          <p className="mt-1 text-[11px] text-red-500">{errors.code.message}</p>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Zone Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register("name")}
          placeholder="e.g. High-Density Storage Zone"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
        {errors.name && (
          <p className="mt-1 text-[11px] text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Description (Optional)
        </label>
        <textarea
          rows={2}
          {...register("description")}
          placeholder="Optional notes or location specifications..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
        {errors.description && (
          <p className="mt-1 text-[11px] text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Capacity */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Capacity
        </label>
        <input
          type="number"
          min={0}
          {...register("capacity", { valueAsNumber: true })}
          placeholder="0"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
        {errors.capacity && (
          <p className="mt-1 text-[11px] text-red-500">{errors.capacity.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
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
          {isEditing ? "Save Changes" : "Create Zone"}
        </Button>
      </div>
    </form>
  );
}
