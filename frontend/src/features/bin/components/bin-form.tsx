"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createBinSchema,
  CreateBinFormValues,
} from "../bin.schema";
import { CreateBinPayload, UpdateBinPayload, Bin } from "../bin.types";
import { useShelves } from "@/features/shelf/shelf.hooks";
import { ShelfCombobox } from "./shelf-combobox";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface BinFormProps {
  initialData?: Bin | null;
  defaultShelfId?: string;
  onSubmit: (values: CreateBinPayload | UpdateBinPayload) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

export function BinForm({
  initialData,
  defaultShelfId,
  onSubmit,
  onCancel,
  isPending,
}: BinFormProps) {
  const isEditing = Boolean(initialData);
  const showShelfSelector = !defaultShelfId;

  // Fetch active shelves only when the selector is needed
  const { data: shelvesData, isLoading: isLoadingShelves } = useShelves(
    showShelfSelector ? { limit: 200, status: "ACTIVE" } : undefined
  );
  const shelves = shelvesData?.data || [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateBinFormValues>({
    resolver: zodResolver(createBinSchema),
    defaultValues: {
      shelfId: initialData?.shelfId || defaultShelfId || "",
      code: initialData?.code || "",
      name: initialData?.name || "",
      description: initialData?.description || "",
      capacity: initialData?.capacity ?? 0,
    },
  });

  const onFormSubmit = async (values: CreateBinFormValues) => {
    await onSubmit({
      shelfId: values.shelfId,
      code: values.code,
      name: values.name,
      description: values.description || undefined,
      capacity: Number(values.capacity),
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Shelf Selection — only on global /bins page */}
      {showShelfSelector && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Storage Shelf <span className="text-red-500">*</span>
          </label>

          {isLoadingShelves ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Loading active shelves...</span>
            </div>
          ) : (
            <Controller
              name="shelfId"
              control={control}
              render={({ field }) => (
                <ShelfCombobox
                  shelves={shelves}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                  error={errors.shelfId?.message}
                />
              )}
            />
          )}

          {errors.shelfId && (
            <p className="mt-1 text-[11px] text-red-500">{errors.shelfId.message}</p>
          )}
        </div>
      )}

      {/* Code */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Bin Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register("code")}
          placeholder="e.g. BIN-01, B-1"
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
          Bin Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register("name")}
          placeholder="e.g. Small Parts Bin 01"
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
          placeholder="Optional bin notes or storage type..."
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
          {isEditing ? "Save Changes" : "Create Bin"}
        </Button>
      </div>
    </form>
  );
}
