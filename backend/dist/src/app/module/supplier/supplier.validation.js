import { z } from "zod";
import { SupplierStatus } from "../../../generated/prisma/index.js";
const createSupplierValidationSchema = z.object({
    name: z
        .string({
        message: "Name is required.",
    })
        .min(1, "Name cannot be empty."),
    code: z
        .string({
        message: "Code is required.",
    })
        .min(1, "Code cannot be empty."),
    email: z.string().email("Invalid email address.").optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    contactPerson: z.string().optional().nullable(),
    status: z.nativeEnum(SupplierStatus).optional(),
});
const updateSupplierValidationSchema = z.object({
    name: z.string().min(1, "Name cannot be empty.").optional(),
    code: z.string().min(1, "Code cannot be empty.").optional(),
    email: z.string().email("Invalid email address.").optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    contactPerson: z.string().optional().nullable(),
    status: z.nativeEnum(SupplierStatus).optional(),
});
const updateSupplierStatusValidationSchema = z.object({
    status: z.nativeEnum(SupplierStatus, {
        message: "Status is required.",
    }),
});
export const SupplierValidation = {
    createSupplierValidationSchema,
    updateSupplierValidationSchema,
    updateSupplierStatusValidationSchema,
};
