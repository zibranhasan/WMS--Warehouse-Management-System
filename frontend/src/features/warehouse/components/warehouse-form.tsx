"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Warehouse,
  CreateWarehousePayload,
  UpdateWarehousePayload,
} from "../warehouse.types";
import {
  createWarehouseSchema,
  CreateWarehouseFormValues,
} from "../warehouse.schema";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/api-error";
import { AlertCircle, Loader2 } from "lucide-react";

interface WarehouseFormProps {
  initialData?: Warehouse | null;
  onSubmit: (
    values: CreateWarehousePayload | UpdateWarehousePayload
  ) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

export function WarehouseForm({
  initialData,
  onSubmit,
  onCancel,
  isPending,
}: WarehouseFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateWarehouseFormValues>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: {
      code: initialData?.code || "",
      name: initialData?.name || "",
      description: initialData?.description || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      country: initialData?.country || "",
    },
  });

  const handleFormSubmit = async (values: CreateWarehouseFormValues) => {
    setErrorMessage(null);
    try {
      if (initialData) {
        // Edit mode: DO NOT send code field in update payload (code is immutable)
        const updatePayload: UpdateWarehousePayload = {
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          address: values.address?.trim() || undefined,
          city: values.city?.trim() || undefined,
          country: values.country?.trim() || undefined,
        };
        await onSubmit(updatePayload);
      } else {
        // Create mode: send all fields including code
        const createPayload: CreateWarehousePayload = {
          code: values.code.trim(),
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          address: values.address?.trim() || undefined,
          city: values.city?.trim() || undefined,
          country: values.country?.trim() || undefined,
        };
        await onSubmit(createPayload);
      }
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
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-4 max-h-[80vh] overflow-y-auto pr-1"
    >
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Code Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="code"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Warehouse Code <span className="text-red-500">*</span>
          </label>
          <input
            id="code"
            type="text"
            placeholder="e.g. WH-001"
            disabled={isPending || Boolean(initialData)}
            {...register("code")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800"
          />
          {initialData && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Warehouse code is immutable and cannot be changed.
            </p>
          )}
          {errors.code && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {errors.code.message}
            </p>
          )}
        </div>

        {/* Name Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Warehouse Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            placeholder="e.g. Central Distribution Hub"
            disabled={isPending}
            {...register("name")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          {errors.name && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {errors.name.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* City */}
        <div className="space-y-1.5">
          <label
            htmlFor="city"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            City <span className="font-normal text-slate-500">(Optional)</span>
          </label>
          <input
            id="city"
            type="text"
            placeholder="e.g. New York"
            disabled={isPending}
            {...register("city")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          {errors.city && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {errors.city.message}
            </p>
          )}
        </div>

        {/* Country */}
        <div className="space-y-1.5">
          <label
            htmlFor="country"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Country <span className="font-normal text-slate-500">(Optional)</span>
          </label>
          <input
            id="country"
            type="text"
            placeholder="e.g. USA"
            disabled={isPending}
            {...register("country")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          {errors.country && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {errors.country.message}
            </p>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <label
          htmlFor="address"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          Street Address <span className="font-normal text-slate-500">(Optional)</span>
        </label>
        <input
          id="address"
          type="text"
          placeholder="e.g. 100 Industrial Parkway, Suite 4"
          disabled={isPending}
          {...register("address")}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        {errors.address && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {errors.address.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label
          htmlFor="description"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          Description <span className="font-normal text-slate-500">(Optional)</span>
        </label>
        <textarea
          id="description"
          rows={3}
          placeholder="Brief description of warehouse facilities or scope..."
          disabled={isPending}
          {...register("description")}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        {errors.description && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {errors.description.message}
          </p>
        )}
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
          {initialData ? "Save Changes" : "Create Warehouse"}
        </Button>
      </div>
    </form>
  );
}
