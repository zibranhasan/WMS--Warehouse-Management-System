"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createAisleSchema,
  CreateAisleFormValues,
} from "../aisle.schema";
import { CreateAislePayload, UpdateAislePayload, Aisle } from "../aisle.types";
import { useZones } from "@/features/zone/zone.hooks";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AisleFormProps {
  initialData?: Aisle | null;
  defaultZoneId?: string;
  onSubmit: (values: CreateAislePayload | UpdateAislePayload) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

export function AisleForm({
  initialData,
  defaultZoneId,
  onSubmit,
  onCancel,
  isPending,
}: AisleFormProps) {
  const isEditing = Boolean(initialData);

  // Fetch active zones for global creation / edit
  const { data: zonesData, isLoading: isLoadingZones } = useZones({
    limit: 200,
    status: "ACTIVE",
  });
  const zones = zonesData?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateAisleFormValues>({
    resolver: zodResolver(createAisleSchema),
    defaultValues: {
      zoneId: initialData?.zoneId || defaultZoneId || "",
      code: initialData?.code || "",
      name: initialData?.name || "",
      description: initialData?.description || "",
      capacity: initialData?.capacity ?? 0,
    },
  });

  const onFormSubmit = async (values: CreateAisleFormValues) => {
    await onSubmit({
      zoneId: values.zoneId,
      code: values.code,
      name: values.name,
      description: values.description || undefined,
      capacity: Number(values.capacity),
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Zone Selection (Shown when defaultZoneId is not provided) */}
      {!defaultZoneId && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Storage Zone <span className="text-red-500">*</span>
          </label>
          {isLoadingZones ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Loading active zones...</span>
            </div>
          ) : (
            <select
              {...register("zoneId")}
              disabled={isPending}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              <option value="">-- Select Storage Zone --</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.code}) {z.warehouse ? `[${z.warehouse.name}]` : ""}
                </option>
              ))}
            </select>
          )}
          {errors.zoneId && (
            <p className="mt-1 text-[11px] text-red-500">{errors.zoneId.message}</p>
          )}
        </div>
      )}

      {/* Code */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Aisle Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register("code")}
          placeholder="e.g. AISLE-01, A-1"
          disabled={isPending}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
        {errors.code && (
          <p className="mt-1 text-[11px] text-red-500">{errors.code.message}</p>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Aisle Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register("name")}
          placeholder="e.g. Pallet Rack Aisle 1"
          disabled={isPending}
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
          placeholder="Optional aisle notes or location details..."
          disabled={isPending}
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
          disabled={isPending}
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
          {isEditing ? "Save Changes" : "Create Aisle"}
        </Button>
      </div>
    </form>
  );
}
