"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Product, CreateProductPayload, UpdateProductPayload } from "../product.types";
import {
  createProductSchema,
  CreateProductFormValues,
} from "../product.schema";
import { useCategories } from "@/features/category/category.hooks";
import { useBrands } from "@/features/brand/brand.hooks";
import { ImageUpload } from "@/components/shared/image-upload";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/api-error";
import { AlertCircle, Loader2 } from "lucide-react";

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (values: CreateProductPayload | UpdateProductPayload) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

export function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  isPending,
}: ProductFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [removeImageFlag, setRemoveImageFlag] = useState(false);

  // Fetch ACTIVE categories and brands for select dropdowns
  const { data: categoriesData, isLoading: isCategoriesLoading } = useCategories({
    status: "ACTIVE",
    limit: 100,
  });

  const { data: brandsData, isLoading: isBrandsLoading } = useBrands({
    status: "ACTIVE",
    limit: 100,
  });

  const categories = categoriesData?.data || [];
  const brands = brandsData?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      sku: initialData?.sku || "",
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      categoryId: initialData?.categoryId || "",
      brandId: initialData?.brandId || "",
      unit: initialData?.unit || "",
    },
  });

  const handleFormSubmit = async (values: CreateProductFormValues) => {
    setErrorMessage(null);
    try {
      if (initialData) {
        // Edit mode payload
        const updatePayload: UpdateProductPayload = {
          sku: values.sku.trim(),
          name: values.name.trim(),
          ...(values.slug?.trim() ? { slug: values.slug.trim() } : {}),
          description: values.description?.trim() || null,
          categoryId: values.categoryId,
          brandId: values.brandId ? values.brandId : null,
          unit: values.unit.trim(),
          ...(selectedImageFile ? { image: selectedImageFile } : {}),
          ...(removeImageFlag ? { removeImage: true } : {}),
        };
        await onSubmit(updatePayload);
      } else {
        // Create mode payload
        const createPayload: CreateProductPayload = {
          sku: values.sku.trim(),
          name: values.name.trim(),
          ...(values.slug?.trim() ? { slug: values.slug.trim() } : {}),
          ...(values.description?.trim()
            ? { description: values.description.trim() }
            : {}),
          categoryId: values.categoryId,
          ...(values.brandId ? { brandId: values.brandId } : {}),
          unit: values.unit.trim(),
          ...(selectedImageFile ? { image: selectedImageFile } : {}),
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Image Upload Component */}
      <ImageUpload
        currentImageUrl={initialData?.image}
        onFileChange={(file) => setSelectedImageFile(file)}
        onRemoveImage={(remove) => setRemoveImageFlag(remove)}
        disabled={isPending}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* SKU */}
        <div className="space-y-1.5">
          <label
            htmlFor="sku"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            SKU <span className="text-red-500">*</span>
          </label>
          <input
            id="sku"
            type="text"
            placeholder="e.g. ELEC-001"
            disabled={isPending}
            {...register("sku")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          {errors.sku && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {errors.sku.message}
            </p>
          )}
        </div>

        {/* Product Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            placeholder="e.g. Wireless Mouse"
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
        {/* Category Select */}
        <div className="space-y-1.5">
          <label
            htmlFor="categoryId"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="categoryId"
            disabled={isPending || isCategoriesLoading}
            {...register("categoryId")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">
              {isCategoriesLoading ? "Loading categories..." : "Select Category"}
            </option>
            {/* If initial category is inactive, include it in dropdown so user sees current selection */}
            {initialData?.category &&
              !categories.some((c) => c.id === initialData.categoryId) && (
                <option value={initialData.categoryId}>
                  {initialData.category.name} (Inactive)
                </option>
              )}
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {errors.categoryId.message}
            </p>
          )}
        </div>

        {/* Brand Select */}
        <div className="space-y-1.5">
          <label
            htmlFor="brandId"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Brand <span className="font-normal text-slate-500">(Optional)</span>
          </label>
          <select
            id="brandId"
            disabled={isPending || isBrandsLoading}
            {...register("brandId")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">
              {isBrandsLoading ? "Loading brands..." : "No Brand"}
            </option>
            {/* If initial brand is inactive, include it in dropdown */}
            {initialData?.brand &&
              !brands.some((b) => b.id === initialData.brandId) && (
                <option value={initialData.brandId!}>
                  {initialData.brand.name} (Inactive)
                </option>
              )}
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          {errors.brandId && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {errors.brandId.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Unit */}
        <div className="space-y-1.5">
          <label
            htmlFor="unit"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Unit of Measure <span className="text-red-500">*</span>
          </label>
          <input
            id="unit"
            type="text"
            placeholder="e.g. pcs, box, kg"
            disabled={isPending}
            {...register("unit")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          {errors.unit && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {errors.unit.message}
            </p>
          )}
        </div>

        {/* Slug */}
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
            placeholder="e.g. wireless-mouse"
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
          placeholder="Brief description of this product..."
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
          {initialData ? "Save Changes" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
