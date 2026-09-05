import { z } from "zod";

const purchaseOrderItemSchema = z.object({
  productId: z.string().min(1, "Product is required."),
  orderedQuantity: z.coerce
    .number({ message: "Quantity is required." })
    .gt(0, "Quantity must be greater than zero."),
  unitPrice: z.coerce
    .number({ message: "Unit price is required." })
    .gte(0, "Unit price cannot be negative."),
});

export const createPurchaseOrderSchema = z
  .object({
    supplierId: z.string().min(1, "Supplier is required."),
    warehouseId: z.string().min(1, "Warehouse is required."),
    notes: z.string().optional(),
    items: z
      .array(purchaseOrderItemSchema)
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

export type CreatePurchaseOrderFormValues = z.infer<
  typeof createPurchaseOrderSchema
>;

export const updatePurchaseOrderSchema = z
  .object({
    supplierId: z.string().min(1, "Supplier is required.").optional(),
    warehouseId: z.string().min(1, "Warehouse is required.").optional(),
    notes: z.string().optional(),
    items: z
      .array(purchaseOrderItemSchema)
      .min(1, "At least one item is required.")
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.items) return true;
      const productIds = data.items.map((i) => i.productId);
      return new Set(productIds).size === productIds.length;
    },
    {
      message: "Duplicate products are not allowed in the same order.",
      path: ["items"],
    }
  );

export type UpdatePurchaseOrderFormValues = z.infer<
  typeof updatePurchaseOrderSchema
>;
