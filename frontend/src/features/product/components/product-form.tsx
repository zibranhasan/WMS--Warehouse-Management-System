"use client";

import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const categoryOptions = useMemo(() => {
    const list: { value: string; label: string }[] = [
      {
        value: "",
        label: isCategoriesLoading ? "Loading categories..." : "Select Category",
      },
    ];
    if (
      initialData?.category &&
      !categories.some((c) => c.id === initialData.categoryId)
    ) {
      list.push({
        value: initialData.categoryId,
        label: `${initialData.category.name} (Inactive)`,
      });
    }
    categories.forEach((cat) => {
      list.push({ value: cat.id, label: cat.name });
    });
    return list;
  }, [categories, initialData?.category, initialData?.categoryId, isCategoriesLoading]);

  const brandOptions = useMemo(() => {
    const list: { value: string; label: string }[] = [
      {
        value: "",
        label: isBrandsLoading ? "Loading brands..." : "No Brand",
      },
    ];
    if (
      initialData?.brand &&
      !brands.some((b) => b.id === initialData.brandId)
    ) {
      list.push({
        value: initialData.brandId!,
        label: `${initialData.brand.name} (Inactive)`,
      });
    }
    brands.forEach((b) => {
      list.push({ value: b.id, label: b.name });
    });
    return list;
  }, [brands, initialData?.brand, initialData?.brandId, isBrandsLoading]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      sku: initialData?.sku || "",
      name: initialData?.name || "",
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
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
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select
                value={field.value || ""}
                onValueChange={(val) => field.onChange(val ?? "")}
                disabled={isPending || isCategoriesLoading}
                items={categoryOptions}
              >
                <SelectTrigger id="categoryId" className="w-full">
                  <SelectValue
                    placeholder={
                      isCategoriesLoading
                        ? "Loading categories..."
                        : "Select Category"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    {isCategoriesLoading
                      ? "Loading categories..."
                      : "Select Category"}
                  </SelectItem>
                  {initialData?.category &&
                    !categories.some((c) => c.id === initialData.categoryId) && (
                      <SelectItem value={initialData.categoryId}>
                        {initialData.category.name} (Inactive)
                      </SelectItem>
                    )}
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
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
          <Controller
            control={control}
            name="brandId"
            render={({ field }) => (
              <Select
                value={field.value || ""}
                onValueChange={(val) => field.onChange(val ?? "")}
                disabled={isPending || isBrandsLoading}
                items={brandOptions}
              >
                <SelectTrigger id="brandId" className="w-full">
                  <SelectValue
                    placeholder={
                      isBrandsLoading ? "Loading brands..." : "No Brand"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    {isBrandsLoading ? "Loading brands..." : "No Brand"}
                  </SelectItem>
                  {initialData?.brand &&
                    !brands.some((b) => b.id === initialData.brandId) && (
                      <SelectItem value={initialData.brandId!}>
                        {initialData.brand.name} (Inactive)
                      </SelectItem>
                    )}
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
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
