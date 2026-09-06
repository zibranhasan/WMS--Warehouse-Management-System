import { z } from "zod";
const allocateStockValidationSchema = z.object({
    warehouseId: z
        .string({ message: "Warehouse ID is required." })
        .trim()
        .min(1, "Warehouse ID cannot be empty."),
    binId: z
        .string({ message: "Bin ID is required." })
        .trim()
        .min(1, "Bin ID cannot be empty."),
    productId: z
        .string({ message: "Product ID is required." })
        .trim()
        .min(1, "Product ID cannot be empty."),
    quantity: z
        .number({ message: "Quantity is required." })
        .gt(0, "Quantity must be greater than zero."),
    reason: z.string().optional(),
    reference: z.string().optional(),
});
const deallocateStockValidationSchema = z.object({
    warehouseId: z
        .string({ message: "Warehouse ID is required." })
        .trim()
        .min(1, "Warehouse ID cannot be empty."),
    binId: z
        .string({ message: "Bin ID is required." })
        .trim()
        .min(1, "Bin ID cannot be empty."),
    productId: z
        .string({ message: "Product ID is required." })
        .trim()
        .min(1, "Product ID cannot be empty."),
    quantity: z
        .number({ message: "Quantity is required." })
        .gt(0, "Quantity must be greater than zero."),
    reason: z.string().optional(),
    reference: z.string().optional(),
});
const transferStockValidationSchema = z
    .object({
    warehouseId: z
        .string({ message: "Warehouse ID is required." })
        .trim()
        .min(1, "Warehouse ID cannot be empty."),
    productId: z
        .string({ message: "Product ID is required." })
        .trim()
        .min(1, "Product ID cannot be empty."),
    fromBinId: z
        .string({ message: "Source Bin ID is required." })
        .trim()
        .min(1, "Source Bin ID cannot be empty."),
    toBinId: z
        .string({ message: "Destination Bin ID is required." })
        .trim()
        .min(1, "Destination Bin ID cannot be empty."),
    quantity: z
        .number({ message: "Quantity is required." })
        .gt(0, "Quantity must be greater than zero."),
    reason: z.string().optional(),
    reference: z.string().optional(),
})
    .refine((data) => data.fromBinId !== data.toBinId, {
    message: "Source bin and destination bin must be different.",
    path: ["toBinId"],
});
export const InventoryLocationValidation = {
    allocateStockValidationSchema,
    deallocateStockValidationSchema,
    transferStockValidationSchema,
};
