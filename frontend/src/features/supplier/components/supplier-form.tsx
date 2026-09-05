"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Supplier } from "../supplier.types";
import {
  createSupplierSchema,
  CreateSupplierFormValues,
} from "../supplier.schema";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/api-error";
import { AlertCircle, Loader2 } from "lucide-react";

interface SupplierFormProps {
  initialData?: Supplier | null;
  onSubmit: (values: CreateSupplierFormValues) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

export function SupplierForm({
  initialData,
  onSubmit,
  onCancel,
  isPending,
}: SupplierFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSupplierFormValues>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      country: initialData?.country || "",
      contactPerson: initialData?.contactPerson || "",
    },
  });

  useEffect(() => {
    reset({
      name: initialData?.name || "",
      code: initialData?.code || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      country: initialData?.country || "",
      contactPerson: initialData?.contactPerson || "",
    });
    setErrorMessage(null);
  }, [initialData, reset]);

  const handleFormSubmit = async (values: CreateSupplierFormValues) => {
    setErrorMessage(null);
    try {
      const payload: CreateSupplierFormValues = {
        name: values.name.trim(),
        code: values.code.trim(),
        email: values.email?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
        address: values.address?.trim() || undefined,
        city: values.city?.trim() || undefined,
        country: values.country?.trim() || undefined,
        contactPerson: values.contactPerson?.trim() || undefined,
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

      {/* Row 1: Name & Code */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="supplier-name"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Supplier Name <span className="text-red-500">*</span>
          </label>
          <input
            id="supplier-name"
            type="text"
            placeholder="e.g. Acme Corp"
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

        <div className="space-y-1.5">
          <label
            htmlFor="supplier-code"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Supplier Code <span className="text-red-500">*</span>
          </label>
          <input
            id="supplier-code"
            type="text"
            placeholder="e.g. SUP-001"
            disabled={isPending}
            {...register("code")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          {errors.code && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {errors.code.message}
            </p>
          )}
        </div>
      </div>

      {/* Row 2: Contact Person & Phone */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="supplier-contact"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Contact Person <span className="font-normal text-slate-500">(Optional)</span>
          </label>
          <input
            id="supplier-contact"
            type="text"
            placeholder="e.g. John Doe"
            disabled={isPending}
            {...register("contactPerson")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          {errors.contactPerson && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {errors.contactPerson.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="supplier-phone"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Phone <span className="font-normal text-slate-500">(Optional)</span>
          </label>
          <input
            id="supplier-phone"
            type="text"
            placeholder="e.g. +1 555-0199"
            disabled={isPending}
            {...register("phone")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          {errors.phone && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {errors.phone.message}
            </p>
          )}
        </div>
      </div>

      {/* Row 3: Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="supplier-email"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          Email <span className="font-normal text-slate-500">(Optional)</span>
        </label>
        <input
          id="supplier-email"
          type="email"
          placeholder="e.g. contact@acmecorp.com"
          disabled={isPending}
          {...register("email")}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        {errors.email && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Row 4: Address */}
      <div className="space-y-1.5">
        <label
          htmlFor="supplier-address"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          Address <span className="font-normal text-slate-500">(Optional)</span>
        </label>
        <input
          id="supplier-address"
          type="text"
          placeholder="e.g. 123 Industrial Way, Suite 400"
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

      {/* Row 5: City & Country */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="supplier-city"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            City <span className="font-normal text-slate-500">(Optional)</span>
          </label>
          <input
            id="supplier-city"
            type="text"
            placeholder="e.g. San Francisco"
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

        <div className="space-y-1.5">
          <label
            htmlFor="supplier-country"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Country <span className="font-normal text-slate-500">(Optional)</span>
          </label>
          <input
            id="supplier-country"
            type="text"
            placeholder="e.g. United States"
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
          {initialData ? "Save Changes" : "Create Supplier"}
        </Button>
      </div>
    </form>
  );
}
