import { z } from "zod";
import { LocationStatus } from "../../../generated/prisma/index.js";

const createAisleValidationSchema = z.object({
    zoneId: z
        .string({
            message: "Zone ID is required.",
        })
        .trim()
        .min(1, "Zone ID cannot be empty."),
    code: z
        .string({
            message: "Aisle code is required.",
        })
        .trim()
        .min(1, "Aisle code cannot be empty."),
    name: z
        .string({
            message: "Aisle name is required.",
        })
        .trim()
        .min(1, "Aisle name cannot be empty."),
    description: z.string().optional(),
    capacity: z
        .number()
        .min(0, "Capacity must be greater than or equal to 0.")
        .optional()
        .default(0),
});

const updateAisleValidationSchema = z.object({
    zoneId: z.string().trim().min(1, "Zone ID cannot be empty.").optional(),
    code: z.string().trim().min(1, "Aisle code cannot be empty.").optional(),
    name: z.string().trim().min(1, "Aisle name cannot be empty.").optional(),
    description: z.string().optional(),
    capacity: z.number().min(0, "Capacity must be greater than or equal to 0.").optional(),
});

const updateAisleStatusValidationSchema = z.object({
    status: z.nativeEnum(LocationStatus, {
        message: "Status is required.",
    }),
});

export const AisleValidation = {
    createAisleValidationSchema,
    updateAisleValidationSchema,
    updateAisleStatusValidationSchema,
};
