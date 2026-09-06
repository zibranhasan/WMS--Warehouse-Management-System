import { z } from "zod";
const createPackingTaskValidationSchema = z.object({
    salesOrderId: z
        .string({
        message: "Sales Order ID is required.",
    })
        .min(1, "Sales Order ID cannot be empty."),
});
const createPackageValidationSchema = z.object({
    weight: z
        .number({
        message: "Weight must be a valid number.",
    })
        .positive("Weight must be a positive number.")
        .optional(),
    notes: z.string().optional(),
});
const addPackageItemUnitValidationSchema = z.object({
    packingTaskItemId: z
        .string({
        message: "Packing task item ID is required.",
    })
        .min(1, "Packing task item ID cannot be empty."),
    quantity: z
        .number({
        message: "Quantity is required.",
    })
        .gt(0, "Quantity must be greater than zero."),
});
const addPackageItemsValidationSchema = z.object({
    items: z
        .array(addPackageItemUnitValidationSchema, {
        message: "Items array is required.",
    })
        .min(1, "At least one item must be specified for package."),
});
export const PackingValidation = {
    createPackingTaskValidationSchema,
    createPackageValidationSchema,
    addPackageItemsValidationSchema,
};
