import { z } from "zod";
import { Role, UserStatus } from "../../../generated/prisma/index.js";

const createUserValidationSchema = z.object({
    name: z
        .string({
            message: "Name is required.",
        })
        .min(2, "Name must be at least 2 characters."),
    email: z
        .string({
            message: "Email is required.",
        })
        .email("Invalid email address format."),
    role: z.nativeEnum(Role, {
        message: "Invalid or missing role.",
    }),
});


const updateUserValidationSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters.").optional(),
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(UserStatus).optional(),
});

const assignRoleValidationSchema = z.object({
    role: z.nativeEnum(Role, {
        message: "Invalid or missing role.",
    }),
});

const assignWarehouseValidationSchema = z.object({
    warehouseId: z.string({
        message: "Warehouse ID is required.",
    }),
});

export const UserValidation = {
    createUserValidationSchema,
    updateUserValidationSchema,
    assignRoleValidationSchema,
    assignWarehouseValidationSchema,
};
