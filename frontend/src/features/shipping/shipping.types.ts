import { SalesOrder } from "@/features/salesOrder/sales-order.types";
import { Warehouse } from "@/features/warehouse/warehouse.types";

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------
export type ShipmentStatus =
  | "READY"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

export type ShippingMethod = "STANDARD" | "EXPRESS" | "SAME_DAY" | "PICKUP";

// ---------------------------------------------------------------------------
// Related models (minimal subset returned by backend)
// ---------------------------------------------------------------------------
export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ---------------------------------------------------------------------------
// Shipment
// ---------------------------------------------------------------------------
export interface Shipment {
  id: string;
  shipmentNumber: string;
  salesOrderId: string;
  warehouseId: string;
  status: ShipmentStatus;
  shippingMethod: ShippingMethod;
  carrier: string | null;
  trackingNumber: string | null;
  shippingAddress: string;
  shippingCity: string;
  shippingCountry: string;
  shippingPhone: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  warehouse: Warehouse;
  salesOrder: SalesOrder;
}

// ---------------------------------------------------------------------------
// Payloads
// ---------------------------------------------------------------------------
export interface CreateShipmentPayload {
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

export interface UpdateShipmentPayload {
  shippingMethod?: ShippingMethod;
  carrier?: string;
  trackingNumber?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingCountry?: string;
  shippingPhone?: string;
  notes?: string;
}

export interface UpdateShipmentStatusPayload {
  status: ShipmentStatus;
}

// ---------------------------------------------------------------------------
// Query Parameters
// ---------------------------------------------------------------------------
export interface ShippingQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: ShipmentStatus;
  shippingMethod?: ShippingMethod;
  warehouseId?: string;
  salesOrderId?: string;
  carrier?: string;
  createdAt?: string;
  updatedAt?: string;
  fields?: string;
  [key: string]: string | number | undefined;
}

// ---------------------------------------------------------------------------
// API Response Shapes
// ---------------------------------------------------------------------------
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  meta: ApiMeta;
  data: T[];
}
