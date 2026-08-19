import { z } from "zod";
import { LocationStatus } from "../../../generated/prisma/index.js";

const createBinValidationSchema = z.object({
    shelfId: z
        .string({
            message: "Shelf ID is required.",
        })
        .trim()
        .min(1, "Shelf ID cannot be empty."),
    code: z
        .string({
            message: "Bin code is required.",
        })
        .trim()
        .min(1, "Bin code cannot be empty."),
    name: z
        .string({
            message: "Bin name is required.",
        })
        .trim()
        .min(1, "Bin name cannot be empty."),
    description: z.string().optional(),
    capacity: z
        .number()
        .min(0, "Capacity must be greater than or equal to 0.")
        .optional()
        .default(0),
});

const updateBinValidationSchema = z.object({
    shelfId: z.string().trim().min(1, "Shelf ID cannot be empty.").optional(),
    code: z.string().trim().min(1, "Bin code cannot be empty.").optional(),
    name: z.string().trim().min(1, "Bin name cannot be empty.").optional(),
    description: z.string().optional(),
    capacity: z.number().min(0, "Capacity must be greater than or equal to 0.").optional(),
});

const updateBinStatusValidationSchema = z.object({
    status: z.nativeEnum(LocationStatus, {
        message: "Status is required.",
    }),
});

export const BinValidation = {
    createBinValidationSchema,
    updateBinValidationSchema,
    updateBinStatusValidationSchema,
};
