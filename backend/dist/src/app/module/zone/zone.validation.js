import { z } from "zod";
import { LocationStatus } from "../../../generated/prisma/index.js";
const createZoneValidationSchema = z.object({
    warehouseId: z
        .string({
        message: "Warehouse ID is required.",
    })
        .trim()
        .min(1, "Warehouse ID cannot be empty."),
    code: z
        .string({
        message: "Zone code is required.",
    })
        .trim()
        .min(1, "Zone code cannot be empty."),
    name: z
        .string({
        message: "Zone name is required.",
    })
        .trim()
        .min(1, "Zone name cannot be empty."),
    description: z.string().optional(),
    capacity: z
        .number()
        .min(0, "Capacity must be greater than or equal to 0.")
        .optional()
        .default(0),
});
const updateZoneValidationSchema = z.object({
    warehouseId: z.string().trim().min(1, "Warehouse ID cannot be empty.").optional(),
    code: z.string().trim().min(1, "Zone code cannot be empty.").optional(),
    name: z.string().trim().min(1, "Zone name cannot be empty.").optional(),
    description: z.string().optional(),
    capacity: z.number().min(0, "Capacity must be greater than or equal to 0.").optional(),
});
const updateZoneStatusValidationSchema = z.object({
    status: z.nativeEnum(LocationStatus, {
        message: "Status is required.",
    }),
});
export const ZoneValidation = {
    createZoneValidationSchema,
    updateZoneValidationSchema,
    updateZoneStatusValidationSchema,
};
