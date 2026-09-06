import { z } from "zod";
import { ProductStatus } from "../../../generated/prisma/index.js";
const createProductValidationSchema = z.object({
    sku: z
        .string({
        message: "SKU is required.",
    })
        .trim()
        .min(1, "SKU is required."),
    name: z
        .string({
        message: "Name is required.",
    })
        .trim()
        .min(1, "Name is required."),
    slug: z.string().trim().optional(),
    description: z.string().optional(),
    categoryId: z
        .string({
        message: "Category ID is required.",
    })
        .min(1, "Category ID is required."),
    brandId: z.string().optional().nullable(),
    unit: z
        .string({
        message: "Unit is required.",
    })
        .trim()
        .min(1, "Unit is required."),
    status: z.nativeEnum(ProductStatus).optional(),
});
const updateProductValidationSchema = z.object({
    sku: z.string().trim().min(1, "SKU must not be empty.").optional(),
    name: z.string().trim().min(1, "Name must not be empty.").optional(),
    slug: z.string().trim().min(1, "Slug must not be empty.").optional(),
    description: z.string().optional().nullable(),
    categoryId: z
        .string()
        .min(1, "Category ID must not be empty.")
        .optional(),
    brandId: z.string().optional().nullable(),
    unit: z
        .string()
        .trim()
        .min(1, "Unit must not be empty.")
        .optional(),
    status: z.nativeEnum(ProductStatus).optional(),
    removeImage: z.preprocess((value) => value === true || value === "true", z.boolean()).optional(),
});
const updateProductStatusValidationSchema = z.object({
    status: z.nativeEnum(ProductStatus, {
        message: "Invalid or missing status.",
    }),
});
export const ProductValidation = {
    createProductValidationSchema,
    updateProductValidationSchema,
    updateProductStatusValidationSchema,
};
