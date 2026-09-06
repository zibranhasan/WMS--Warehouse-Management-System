import { Product } from "@/features/product/product.types";
import { Warehouse } from "@/features/warehouse/warehouse.types";
import { SalesOrder } from "@/features/salesOrder/sales-order.types";

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------
export type PickingStatus =
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "PARTIALLY_PICKED"
  | "PICKED"
  | "CANCELLED";

export type PickingItemStatus = "PENDING" | "PARTIALLY_PICKED" | "PICKED";

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
// Picking Allocation
// ---------------------------------------------------------------------------
export interface PickingAllocation {
  id: string;
  pickingTaskItemId: string;
  locationStockId: string;
  quantity: number;
  pickedById: string;
  pickedAt: string;
  pickedBy: {
    id: string;
    name: string;
    email: string;
  };
  bin: { id: string; code: string; name: string } | null;
  shelf: { id: string; code: string; name: string } | null;
  aisle: { id: string; code: string; name: string } | null;
  zone: { id: string; code: string; name: string } | null;
}

// ---------------------------------------------------------------------------
// Picking Task Item
// ---------------------------------------------------------------------------
export interface PickingTaskItem {
  id: string;
  pickingTaskId: string;
  salesOrderItemId: string;
  productId: string;
  requiredQuantity: number;
  pickedQuantity: number;
  status: PickingItemStatus;
  createdAt: string;
  updatedAt: string;
  product: Product;
}

// ---------------------------------------------------------------------------
// Picking Task (list response shape — raw Prisma includes)
// ---------------------------------------------------------------------------
export interface PickingTask {
  id: string;
  pickingNumber: string;
  salesOrderId: string;
  warehouseId: string;
  assignedToId: string | null;
  status: PickingStatus;
  createdAt: string;
  updatedAt: string;
  warehouse: Warehouse;
  salesOrder: SalesOrder;
  assignedTo: UserSummary | null;
  items: PickingTaskItem[];
}

// ---------------------------------------------------------------------------
// Picking Task Detail (get-by-ID response — transformed with allocations)
// ---------------------------------------------------------------------------
export interface PickingTaskItemDetail extends PickingTaskItem {
  remainingQuantity: number;
  allocations: PickingAllocation[];
}

export interface PickingTaskDetail extends Omit<PickingTask, "items"> {
  items: PickingTaskItemDetail[];
}

// ---------------------------------------------------------------------------
// Payloads
// ---------------------------------------------------------------------------
export interface CreatePickingPayload {
  salesOrderId: string;
}

export interface AssignPickerPayload {
  assignedToId: string;
}

export interface PickItemUnit {
  pickingTaskItemId: string;
  locationStockId: string;
  quantity: number;
}

export interface PickItemsPayload {
  items: PickItemUnit[];
}

// ---------------------------------------------------------------------------
// Query Parameters
// ---------------------------------------------------------------------------
export interface PickingQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: PickingStatus;
  warehouseId?: string;
  assignedToId?: string;
  salesOrderId?: string;
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
