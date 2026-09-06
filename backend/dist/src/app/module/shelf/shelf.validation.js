import { z } from "zod";
import { LocationStatus } from "../../../generated/prisma/index.js";
const createShelfValidationSchema = z.object({
    aisleId: z
        .string({
        message: "Aisle ID is required.",
    })
        .trim()
        .min(1, "Aisle ID cannot be empty."),
    code: z
        .string({
        message: "Shelf code is required.",
    })
        .trim()
        .min(1, "Shelf code cannot be empty."),
    name: z
        .string({
        message: "Shelf name is required.",
    })
        .trim()
        .min(1, "Shelf name cannot be empty."),
    description: z.string().optional(),
    capacity: z
        .number()
        .min(0, "Capacity must be greater than or equal to 0.")
        .optional()
        .default(0),
});
const updateShelfValidationSchema = z.object({
    aisleId: z.string().trim().min(1, "Aisle ID cannot be empty.").optional(),
    code: z.string().trim().min(1, "Shelf code cannot be empty.").optional(),
    name: z.string().trim().min(1, "Shelf name cannot be empty.").optional(),
    description: z.string().optional(),
    capacity: z.number().min(0, "Capacity must be greater than or equal to 0.").optional(),
});
const updateShelfStatusValidationSchema = z.object({
    status: z.nativeEnum(LocationStatus, {
        message: "Status is required.",
    }),
});
export const ShelfValidation = {
    createShelfValidationSchema,
    updateShelfValidationSchema,
    updateShelfStatusValidationSchema,
};
