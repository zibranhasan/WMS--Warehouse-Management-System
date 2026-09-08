import { Product } from "@/features/product/product.types";
import { Warehouse } from "@/features/warehouse/warehouse.types";
import { SalesOrder } from "@/features/salesOrder/sales-order.types";

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------
export type PackingStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "PARTIALLY_PACKED"
  | "PACKED"
  | "CANCELLED";

export type PackingItemStatus = "PENDING" | "PARTIALLY_PACKED" | "PACKED";

export type PackageStatus = "OPEN" | "PACKED" | "CANCELLED";

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
// Package Item
// ---------------------------------------------------------------------------
export interface PackageItem {
  id: string;
  packageId: string;
  packingTaskItemId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: Product;
}

// ---------------------------------------------------------------------------
// Package
// ---------------------------------------------------------------------------
export interface Package {
  id: string;
  packingTaskId: string;
  packageNumber: string;
  status: PackageStatus;
  weight: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: PackageItem[];
}

// ---------------------------------------------------------------------------
// Packing Task Item
// ---------------------------------------------------------------------------
export interface PackingTaskItem {
  id: string;
  packingTaskId: string;
  salesOrderItemId: string;
  productId: string;
  requiredQuantity: number;
  packedQuantity: number;
  remainingQuantity: number;
  status: PackingItemStatus;
  createdAt: string;
  updatedAt: string;
  product: Product;
}

// ---------------------------------------------------------------------------
// Packing Task
// ---------------------------------------------------------------------------
export interface PackingTask {
  id: string;
  packingNumber: string;
  salesOrderId: string;
  warehouseId: string;
  packedById: string | null;
  status: PackingStatus;
  createdAt: string;
  updatedAt: string;
  warehouse: Warehouse;
  salesOrder: SalesOrder;
  packedBy: UserSummary | null;
  items: PackingTaskItem[];
  packages: Package[];
}

// ---------------------------------------------------------------------------
// Payloads
// ---------------------------------------------------------------------------
export interface CreatePackingTaskPayload {
  salesOrderId: string;
}

export interface AssignPackerPayload {
  assignedToId: string;
}

export interface CancelPackingTaskPayload {
  cancellationReason: string;
}

export interface CreatePackagePayload {
  weight?: number;
  notes?: string;
}

export interface AddPackageItemUnit {
  packingTaskItemId: string;
  quantity: number;
}

export interface AddPackageItemsPayload {
  items: AddPackageItemUnit[];
}

// ---------------------------------------------------------------------------
// Query Parameters
// ---------------------------------------------------------------------------
export interface PackingTaskQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: PackingStatus;
  warehouseId?: string;
  salesOrderId?: string;
  packedById?: string;
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
