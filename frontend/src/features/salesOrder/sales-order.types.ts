import { Product } from "@/features/product/product.types";
import { Warehouse } from "@/features/warehouse/warehouse.types";

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------
export type SalesOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type ReservationStatus = "ACTIVE" | "RELEASED" | "CONSUMED";

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
// Stock Reservation
// ---------------------------------------------------------------------------
export interface StockReservation {
  id: string;
  salesOrderId: string;
  salesOrderItemId: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Sales Order Item
// ---------------------------------------------------------------------------
export interface SalesOrderItem {
  id: string;
  salesOrderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reservedQuantity: number;
  createdAt: string;
  updatedAt: string;
  product: Product;
}

// ---------------------------------------------------------------------------
// Sales Order
// ---------------------------------------------------------------------------
export interface SalesOrder {
  id: string;
  orderNumber: string;
  createdById: string;
  warehouseId: string;
  status: SalesOrderStatus;
  totalAmount: number;
  notes?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  warehouse: Warehouse;
  createdBy: UserSummary;
  items: SalesOrderItem[];
  reservations: StockReservation[];
}

// ---------------------------------------------------------------------------
// Payloads
// ---------------------------------------------------------------------------
export interface CreateSalesOrderItemPayload {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateSalesOrderPayload {
  warehouseId: string;
  items: CreateSalesOrderItemPayload[];
  notes?: string | null;
}

export interface CancelSalesOrderPayload {
  cancellationReason: string;
}

// ---------------------------------------------------------------------------
// Query Parameters
// ---------------------------------------------------------------------------
export interface SalesOrderQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  warehouseId?: string;
  createdById?: string;
  status?: SalesOrderStatus;
  createdAt?: string;
  updatedAt?: string;
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
