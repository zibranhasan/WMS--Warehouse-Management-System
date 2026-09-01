"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createShelfSchema,
  CreateShelfFormValues,
} from "../shelf.schema";
import { CreateShelfPayload, UpdateShelfPayload, Shelf } from "../shelf.types";
import { useAisles } from "@/features/aisle/aisle.hooks";
import { AisleCombobox } from "./aisle-combobox";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ShelfFormProps {
  initialData?: Shelf | null;
  defaultAisleId?: string;
  onSubmit: (values: CreateShelfPayload | UpdateShelfPayload) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

export function ShelfForm({
  initialData,
  defaultAisleId,
  onSubmit,
  onCancel,
  isPending,
}: ShelfFormProps) {
  const isEditing = Boolean(initialData);
  const showAisleSelector = !defaultAisleId;

  // Fetch active aisles only when selector is needed
  const { data: aislesData, isLoading: isLoadingAisles } = useAisles(
    showAisleSelector ? { limit: 200, status: "ACTIVE" } : undefined
  );
  const aisles = aislesData?.data || [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateShelfFormValues>({
    resolver: zodResolver(createShelfSchema),
    defaultValues: {
      aisleId: initialData?.aisleId || defaultAisleId || "",
      code: initialData?.code || "",
      name: initialData?.name || "",
      description: initialData?.description || "",
      capacity: initialData?.capacity ?? 0,
    },
  });

  const onFormSubmit = async (values: CreateShelfFormValues) => {
    await onSubmit({
      aisleId: values.aisleId,
      code: values.code,
      name: values.name,
      description: values.description || undefined,
      capacity: Number(values.capacity),
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Aisle Selection (Shown on global /shelves page) */}
      {showAisleSelector && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Storage Aisle <span className="text-red-500">*</span>
          </label>
          {isLoadingAisles ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Loading active aisles...</span>
            </div>
          ) : (
            <Controller
              name="aisleId"
              control={control}
              render={({ field }) => (
                <AisleCombobox
                  aisles={aisles}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                  error={errors.aisleId?.message}
                />
              )}
            />
          )}
          {errors.aisleId && (
            <p className="mt-1 text-[11px] text-red-500">{errors.aisleId.message}</p>
          )}
        </div>
      )}

      {/* Code */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Shelf Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register("code")}
          placeholder="e.g. SHELF-01, S-1"
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
          Shelf Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register("name")}
          placeholder="e.g. Heavy Duty Bay Level 1"
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
          placeholder="Optional shelf notes or dimensions..."
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
          {isEditing ? "Save Changes" : "Create Shelf"}
        </Button>
      </div>
    </form>
  );
}
