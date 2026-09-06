import { z } from "zod";
const salesOrderItemValidationSchema = z.object({
    productId: z
        .string({
        message: "Product ID is required.",
    })
        .min(1, "Product ID cannot be empty."),
    quantity: z
        .number({
        message: "Quantity is required.",
    })
        .gt(0, "Quantity must be greater than zero."),
    unitPrice: z
        .number({
        message: "Unit price is required.",
    })
        .gt(0, "Unit price must be greater than zero."),
});
const createSalesOrderValidationSchema = z.object({
    warehouseId: z
        .string({
        message: "Warehouse ID is required.",
    })
        .min(1, "Warehouse ID cannot be empty."),
    notes: z.string().optional().nullable(),
    items: z
        .array(salesOrderItemValidationSchema, {
        message: "Items are required.",
    })
        .min(1, "Sales order must contain at least one item."),
});
const cancelSalesOrderValidationSchema = z.object({
    cancellationReason: z
        .string({
        message: "Cancellation reason is required.",
    })
        .min(1, "Cancellation reason cannot be empty."),
});
export const SalesOrderValidation = {
    createSalesOrderValidationSchema,
    cancelSalesOrderValidationSchema,
};
