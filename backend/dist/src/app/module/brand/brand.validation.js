import { z } from "zod";
import { BrandStatus } from "../../../generated/prisma/index.js";
const createBrandValidationSchema = z.object({
    name: z
        .string({
        message: "Name is required.",
    })
        .min(1, "Name is required."),
    slug: z.string().optional(),
    description: z.string().optional(),
});
const updateBrandValidationSchema = z.object({
    name: z.string().min(1, "Name must not be empty.").optional(),
    slug: z.string().min(1, "Slug must not be empty.").optional(),
    description: z.string().optional(),
    status: z.nativeEnum(BrandStatus).optional(),
});
const updateBrandStatusValidationSchema = z.object({
    status: z.nativeEnum(BrandStatus, {
        message: "Invalid or missing status.",
    }),
});
export const BrandValidation = {
    createBrandValidationSchema,
    updateBrandValidationSchema,
    updateBrandStatusValidationSchema,
};
