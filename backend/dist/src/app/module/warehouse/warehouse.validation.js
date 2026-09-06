import { z } from "zod";
import { WarehouseStatus } from "../../../generated/prisma/index.js";
const createWarehouseValidationSchema = z.object({
    code: z
        .string({
        message: "Code is required.",
    })
        .min(1, "Code is required."),
    name: z
        .string({
        message: "Name is required.",
    })
        .min(1, "Name is required."),
    description: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
});
const updateWarehouseValidationSchema = z.object({
    name: z.string().min(1, "Name must not be empty.").optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    status: z.nativeEnum(WarehouseStatus).optional(),
});
const updateWarehouseStatusValidationSchema = z.object({
    status: z.nativeEnum(WarehouseStatus, {
        message: "Invalid or missing status.",
    }),
});
export const WarehouseValidation = {
    createWarehouseValidationSchema,
    updateWarehouseValidationSchema,
    updateWarehouseStatusValidationSchema,
};
