import { Product } from "@/features/product/product.types";
import { Warehouse } from "@/features/warehouse/warehouse.types";

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------
export type PurchaseOrderStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

// ---------------------------------------------------------------------------
// Related models (minimal subset returned by backend)
// ---------------------------------------------------------------------------
export interface Supplier {
  id: string;
  name: string;
  code: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  contactPerson?: string | null;
  status: "ACTIVE" | "INACTIVE";
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ---------------------------------------------------------------------------
// Purchase Order Item
// ---------------------------------------------------------------------------
export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  product: Product;
}

// ---------------------------------------------------------------------------
// Purchase Order
// ---------------------------------------------------------------------------
export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  warehouseId: string;
  status: PurchaseOrderStatus;
  notes?: string | null;
  totalAmount: number;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  createdById: string;
  approvedById?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  supplier: Supplier;
  warehouse: Warehouse;
  createdBy: UserSummary;
  approvedBy?: UserSummary | null;
  items: PurchaseOrderItem[];
}

// ---------------------------------------------------------------------------
// Goods Receipt Item
// ---------------------------------------------------------------------------
export interface GoodsReceiptItem {
  id: string;
  goodsReceiptId: string;
  productId: string;
  quantity: number;
  product: Product;
}

// ---------------------------------------------------------------------------
// Goods Receipt
// ---------------------------------------------------------------------------
export interface GoodsReceipt {
  id: string;
  receiptNumber: string;
  purchaseOrderId: string;
  warehouseId: string;
  receivedById: string;
  receivedAt: string;
  reason?: string | null;
  reference?: string | null;
  createdAt: string;
  updatedAt: string;
  receivedBy: UserSummary;
  items: GoodsReceiptItem[];
  warehouse: Warehouse;
}

// ---------------------------------------------------------------------------
// Payloads
// ---------------------------------------------------------------------------
export interface CreatePurchaseOrderItemPayload {
  productId: string;
  orderedQuantity: number;
  unitPrice: number;
}

export interface CreatePurchaseOrderPayload {
  supplierId: string;
  warehouseId: string;
  notes?: string;
  items: CreatePurchaseOrderItemPayload[];
}

export interface UpdatePurchaseOrderPayload {
  supplierId?: string;
  warehouseId?: string;
  notes?: string;
  items?: CreatePurchaseOrderItemPayload[];
}

export interface RejectPurchaseOrderPayload {
  rejectionReason?: string;
}

export interface CancelPurchaseOrderPayload {
  cancellationReason?: string;
}

export interface ReceiveItemPayload {
  productId: string;
  receivedQuantity: number;
}

export interface ReceiveGoodsPayload {
  items: ReceiveItemPayload[];
  reason?: string;
  reference?: string;
}

// ---------------------------------------------------------------------------
// Query Parameters
// ---------------------------------------------------------------------------
export interface PurchaseOrderQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  supplierId?: string;
  warehouseId?: string;
  status?: PurchaseOrderStatus;
  createdById?: string;
  approvedById?: string;
  poNumber?: string;
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
