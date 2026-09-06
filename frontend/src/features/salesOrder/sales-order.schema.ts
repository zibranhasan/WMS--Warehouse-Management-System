import { z } from "zod";

const salesOrderItemSchema = z.object({
  productId: z.string().min(1, "Product is required."),
  quantity: z.coerce
    .number({ message: "Quantity is required." })
    .gt(0, "Quantity must be greater than zero."),
  unitPrice: z.coerce
    .number({ message: "Unit price is required." })
    .gt(0, "Unit price must be greater than zero."),
});

export const createSalesOrderSchema = z
  .object({
    warehouseId: z.string().min(1, "Warehouse is required."),
    notes: z.string().optional().nullable(),
    items: z
      .array(salesOrderItemSchema)
      .min(1, "At least one item is required."),
  })
  .refine(
    (data) => {
      const productIds = data.items.map((i) => i.productId);
      return new Set(productIds).size === productIds.length;
    },
    {
      message: "Duplicate products are not allowed in the same order.",
      path: ["items"],
    }
  );

export type CreateSalesOrderFormValues = z.infer<
  typeof createSalesOrderSchema
>;

export const cancelSalesOrderSchema = z.object({
  cancellationReason: z
    .string({ message: "Cancellation reason is required." })
    .min(1, "Cancellation reason cannot be empty."),
});

export type CancelSalesOrderFormValues = z.infer<
  typeof cancelSalesOrderSchema
>;
