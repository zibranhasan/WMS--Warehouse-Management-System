import { ShipmentStatus, ShippingMethod } from "../../../generated/prisma/index.js";

export interface ICreateShipment {
    salesOrderId: string;
    shippingMethod: ShippingMethod;
    carrier?: string;
    trackingNumber?: string;
    shippingAddress: string;
    shippingCity: string;
    shippingCountry: string;
    shippingPhone: string;
    notes?: string;
}

export interface IUpdateShipmentStatus {
    status: ShipmentStatus;
}

export interface IUpdateShipment {
    shippingMethod?: ShippingMethod;
    carrier?: string;
    trackingNumber?: string;
    shippingAddress?: string;
    shippingCity?: string;
    shippingCountry?: string;
    shippingPhone?: string;
    notes?: string;
}
