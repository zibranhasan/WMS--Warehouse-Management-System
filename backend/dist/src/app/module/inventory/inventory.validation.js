import { z } from "zod";
import { StockMovementType } from "../../../generated/prisma/index.js";
// ---------------------------------------------------------------------------
// Stock Adjustment Schema
// ---------------------------------------------------------------------------
const stockAdjustmentValidationSchema = z
    .object({
    warehouseId: z
        .string({ message: "Warehouse ID is required." })
        .min(1, "Warehouse ID is required."),
    productId: z
        .string({ message: "Product ID is required." })
        .min(1, "Product ID is required."),
    type: z.nativeEnum(StockMovementType, {
        message: "Type must be IN, OUT, or ADJUSTMENT.",
    }),
    quantity: z.number({ message: "Quantity must be a number." }),
    reason: z.string().optional(),
    reference: z.string().optional(),
})
    .superRefine((data, ctx) => {
    if (data.type === StockMovementType.IN || data.type === StockMovementType.OUT) {
        if (data.quantity <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Quantity must be greater than zero for IN and OUT movements.",
                path: ["quantity"],
            });
        }
    }
    else if (data.type === StockMovementType.ADJUSTMENT) {
        if (data.quantity === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Quantity cannot be zero for ADJUSTMENT.",
                path: ["quantity"],
            });
        }
    }
});
export const InventoryValidation = {
    stockAdjustmentValidationSchema,
};
