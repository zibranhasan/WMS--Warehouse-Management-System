import { z } from "zod";

export const createProductSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required."),
  name: z.string().trim().min(1, "Name is required."),
  slug: z.string().trim().optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required."),
  brandId: z.string().optional().nullable(),
  unit: z.string().trim().min(1, "Unit is required."),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  image: z.custom<File | null>().optional(),
});

export type CreateProductFormValues = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  sku: z.string().trim().min(1, "SKU must not be empty.").optional(),
  name: z.string().trim().min(1, "Name must not be empty.").optional(),
  slug: z.string().trim().min(1, "Slug must not be empty.").optional(),
  description: z.string().optional().nullable(),
  categoryId: z.string().min(1, "Category ID must not be empty.").optional(),
  brandId: z.string().optional().nullable(),
  unit: z.string().trim().min(1, "Unit must not be empty.").optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  removeImage: z.boolean().optional(),
  image: z.custom<File | null>().optional(),
});

export type UpdateProductFormValues = z.infer<typeof updateProductSchema>;

export const updateProductStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"], {
    message: "Invalid or missing status.",
  }),
});

export type UpdateProductStatusFormValues = z.infer<
  typeof updateProductStatusSchema
>;
