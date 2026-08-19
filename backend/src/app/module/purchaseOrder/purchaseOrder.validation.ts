import { z } from "zod";

const purchaseOrderItemValidationSchema = z.object({
    productId: z
        .string({
            message: "Product ID is required.",
        })
        .min(1, "Product ID cannot be empty."),
    orderedQuantity: z
        .number({
            message: "Ordered quantity is required.",
        })
        .gt(0, "Ordered quantity must be greater than zero."),
    unitPrice: z
        .number({
            message: "Unit price is required.",
        })
        .gte(0, "Unit price cannot be negative."),
});

const createPurchaseOrderValidationSchema = z.object({
    supplierId: z
        .string({
            message: "Supplier ID is required.",
        })
        .min(1, "Supplier ID cannot be empty."),
    warehouseId: z
        .string({
            message: "Warehouse ID is required.",
        })
        .min(1, "Warehouse ID cannot be empty."),
    notes: z.string().optional().nullable(),
    items: z
        .array(purchaseOrderItemValidationSchema, {
            message: "Items are required.",
        })
        .min(1, "Purchase order must contain at least one item."),
});

const updatePurchaseOrderValidationSchema = z.object({
    supplierId: z.string().min(1).optional(),
    warehouseId: z.string().min(1).optional(),
    notes: z.string().optional().nullable(),
    items: z
        .array(purchaseOrderItemValidationSchema)
        .min(1, "Purchase order must contain at least one item.")
        .optional(),
});

const rejectPurchaseOrderValidationSchema = z.object({
    rejectionReason: z.string().optional().nullable(),
});

const cancelPurchaseOrderValidationSchema = z.object({
    cancellationReason: z.string().optional().nullable(),
});

const receiveItemValidationSchema = z
    .object({
        productId: z
            .string({
                message: "Product ID is required.",
            })
            .min(1, "Product ID cannot be empty."),
        receivedQuantity: z
            .number()
            .gt(0, "Received quantity must be greater than zero.")
            .optional(),
        quantity: z
            .number()
            .gt(0, "Quantity must be greater than zero.")
            .optional(),
        Quantity: z
            .number()
            .gt(0, "Quantity must be greater than zero.")
            .optional(),
    })
    .transform((data) => {
        const qty = data.receivedQuantity ?? data.quantity ?? data.Quantity;
        return {
            productId: data.productId,
            receivedQuantity: qty as number,
            quantity: qty as number,
        };
    })
    .refine(
        (data) =>
            data.receivedQuantity !== undefined &&
            typeof data.receivedQuantity === "number" &&
            !isNaN(data.receivedQuantity) &&
            data.receivedQuantity > 0,
        {
            message: "Received quantity is required and must be greater than zero.",
            path: ["quantity"],
        },
    );

const receiveGoodsValidationSchema = z.object({
    items: z
        .array(receiveItemValidationSchema, {
            message: "Items are required.",
        })
        .min(1, "At least one item must be received."),
    reason: z.string().optional().nullable(),
    reference: z.string().optional().nullable(),
});

export const PurchaseOrderValidation = {
    createPurchaseOrderValidationSchema,
    updatePurchaseOrderValidationSchema,
    rejectPurchaseOrderValidationSchema,
    cancelPurchaseOrderValidationSchema,
    receiveGoodsValidationSchema,
};
