"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Brand } from "../brand.types";
import {
  createBrandSchema,
  CreateBrandFormValues,
} from "../brand.schema";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/api-error";
import { AlertCircle, Loader2 } from "lucide-react";

interface BrandFormProps {
  initialData?: Brand | null;
  onSubmit: (values: CreateBrandFormValues) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

export function BrandForm({
  initialData,
  onSubmit,
  onCancel,
  isPending,
}: BrandFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateBrandFormValues>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
    },
  });

  const handleFormSubmit = async (values: CreateBrandFormValues) => {
    setErrorMessage(null);
    try {
      // Omit empty optional strings so backend auto-generates slug if left empty
      const payload: CreateBrandFormValues = {
        name: values.name.trim(),
        ...(values.slug?.trim() ? { slug: values.slug.trim() } : {}),
        ...(values.description?.trim()
          ? { description: values.description.trim() }
          : {}),
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Brand Name */}
      <div className="space-y-1.5">
        <label
          htmlFor="name"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          Brand Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          placeholder="e.g. Nike"
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

      {/* Brand Slug */}
      <div className="space-y-1.5">
        <label
          htmlFor="slug"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          Slug <span className="font-normal text-slate-500">(Optional)</span>
        </label>
        <input
          id="slug"
          type="text"
          placeholder="e.g. nike"
          disabled={isPending}
          {...register("slug")}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Leave blank to generate automatically.
        </p>
        {errors.slug && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {errors.slug.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label
          htmlFor="description"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          Description{" "}
          <span className="font-normal text-slate-500">(Optional)</span>
        </label>
        <textarea
          id="description"
          rows={3}
          placeholder="Brief description of this brand..."
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
      <div className="flex items-center justify-end gap-2.5 pt-2">
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
          {initialData ? "Save Changes" : "Create Brand"}
        </Button>
      </div>
    </form>
  );
}
