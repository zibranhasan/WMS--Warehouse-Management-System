import { z } from "zod";
const createPickingTaskValidationSchema = z.object({
    salesOrderId: z
        .string({
        message: "Sales Order ID is required.",
    })
        .min(1, "Sales Order ID cannot be empty."),
});
const assignPickerValidationSchema = z.object({
    assignedToId: z
        .string({
        message: "Assigned user ID is required.",
    })
        .min(1, "Assigned user ID cannot be empty."),
});
const pickItemUnitValidationSchema = z.object({
    pickingTaskItemId: z
        .string({
        message: "Picking task item ID is required.",
    })
        .min(1, "Picking task item ID cannot be empty."),
    locationStockId: z
        .string({
        message: "Location stock ID is required.",
    })
        .min(1, "Location stock ID cannot be empty."),
    quantity: z
        .number({
        message: "Quantity is required.",
    })
        .gt(0, "Pick quantity must be greater than zero."),
});
const pickItemsValidationSchema = z.object({
    items: z
        .array(pickItemUnitValidationSchema, {
        message: "Items array is required.",
    })
        .min(1, "At least one item must be specified for picking."),
});
export const PickingValidation = {
    createPickingTaskValidationSchema,
    assignPickerValidationSchema,
    pickItemsValidationSchema,
};
