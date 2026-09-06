import { z } from "zod";
import { ShipmentStatus, ShippingMethod } from "../../../generated/prisma/index.js";
const createShipmentValidationSchema = z.object({
    salesOrderId: z
        .string({
        message: "Sales Order ID is required.",
    })
        .min(1, "Sales Order ID cannot be empty."),
    shippingMethod: z.nativeEnum(ShippingMethod, {
        message: "Valid shipping method is required.",
    }),
    shippingAddress: z
        .string({
        message: "Shipping address is required.",
    })
        .min(1, "Shipping address cannot be empty."),
    shippingCity: z
        .string({
        message: "Shipping city is required.",
    })
        .min(1, "Shipping city cannot be empty."),
    shippingCountry: z
        .string({
        message: "Shipping country is required.",
    })
        .min(1, "Shipping country cannot be empty."),
    shippingPhone: z
        .string({
        message: "Shipping phone is required.",
    })
        .min(1, "Shipping phone cannot be empty."),
    carrier: z.string().optional(),
    trackingNumber: z.string().optional(),
    notes: z.string().optional(),
});
const updateShipmentStatusValidationSchema = z.object({
    status: z.nativeEnum(ShipmentStatus, {
        message: "Valid shipment status is required.",
    }),
});
const updateShipmentValidationSchema = z.object({
    shippingMethod: z.nativeEnum(ShippingMethod).optional(),
    carrier: z.string().optional(),
    trackingNumber: z.string().optional(),
    shippingAddress: z.string().min(1, "Shipping address cannot be empty.").optional(),
    shippingCity: z.string().min(1, "Shipping city cannot be empty.").optional(),
    shippingCountry: z.string().min(1, "Shipping country cannot be empty.").optional(),
    shippingPhone: z.string().min(1, "Shipping phone cannot be empty.").optional(),
    notes: z.string().optional(),
});
export const ShippingValidation = {
    createShipmentValidationSchema,
    updateShipmentStatusValidationSchema,
    updateShipmentValidationSchema,
};
