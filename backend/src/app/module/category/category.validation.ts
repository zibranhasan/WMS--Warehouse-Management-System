import { z } from "zod";
import { CategoryStatus } from "../../../generated/prisma/index.js";

const createCategoryValidationSchema = z.object({
    name: z
        .string({
            message: "Name is required.",
        })
        .min(1, "Name is required."),
    slug: z.string().optional(),
    description: z.string().optional(),
});

const updateCategoryValidationSchema = z.object({
    name: z.string().min(1, "Name must not be empty.").optional(),
    slug: z.string().min(1, "Slug must not be empty.").optional(),
    description: z.string().optional(),
    status: z.nativeEnum(CategoryStatus).optional(),
});

const updateCategoryStatusValidationSchema = z.object({
    status: z.nativeEnum(CategoryStatus, {
        message: "Invalid or missing status.",
    }),
});

export const CategoryValidation = {
    createCategoryValidationSchema,
    updateCategoryValidationSchema,
    updateCategoryStatusValidationSchema,
};
