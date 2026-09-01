import { Product } from "@/features/product/product.types";
import { Warehouse } from "@/features/warehouse/warehouse.types";
import { Bin } from "@/features/bin/bin.types";

export type StockMovementType = "IN" | "OUT" | "ADJUSTMENT";
export type LocationMovementType = "ALLOCATE" | "DEALLOCATE" | "TRANSFER";

export interface InventoryStock {
  id: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  warehouse?: Warehouse;
  product?: Product;
}

export interface StockMovement {
  id: string;
  warehouseId: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string | null;
  reference?: string | null;
  createdById?: string | null;
  createdAt: string;
  warehouse?: Warehouse;
  product?: Product;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export interface InventoryLocationStock {
  id: string;
  warehouseId: string;
  binId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  warehouse?: Warehouse;
  bin?: Bin;
  product?: Product;
}

export interface InventoryLocationMovement {
  id: string;
  warehouseId: string;
  productId: string;
  type: LocationMovementType;
  fromBinId?: string | null;
  toBinId?: string | null;
  quantity: number;
  reason?: string | null;
  reference?: string | null;
  createdById?: string | null;
  createdAt: string;
  warehouse?: Warehouse;
  product?: Product;
  fromBin?: Bin | null;
  toBin?: Bin | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export interface InventoryLocationSummary {
  locationStockId: string;
  quantity: number;
  zone: { id: string; code: string; name: string } | null;
  aisle: { id: string; code: string; name: string } | null;
  shelf: { id: string; code: string; name: string } | null;
  bin: { id: string; code: string; name: string } | null;
}

export interface InventorySummary {
  product: {
    id: string;
    sku: string;
    name: string;
    unit: string;
  };
  warehouse: {
    id: string;
    code: string;
    name: string;
  };
  inventoryStock: number;
  allocatedStock: number;
  reservedStock: number;
  availableStock: number;
  unallocatedStock: number;
  locations: InventoryLocationSummary[];
}

export interface BinStockSummary {
  bin: {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    status: string;
  };
  warehouse?: Warehouse;
  zone: { id: string; code: string; name: string } | null;
  aisle: { id: string; code: string; name: string } | null;
  shelf: { id: string; code: string; name: string } | null;
  capacity: number;
  usedCapacity: number;
  availableCapacity: number;
  products: Array<{
    id: string;
    productId: string;
    product: Product;
    quantity: number;
  }>;
}

export interface ProductLocationGroup {
  warehouse: Warehouse;
  locations: Array<{
    id: string;
    quantity: number;
    zone: { id: string; code: string; name: string } | null;
    aisle: { id: string; code: string; name: string } | null;
    shelf: { id: string; code: string; name: string } | null;
    bin: { id: string; code: string; name: string };
  }>;
}

export interface ProductLocationsResponse {
  product: {
    id: string;
    sku: string;
    name: string;
    unit: string;
  };
  warehouseLocations: ProductLocationGroup[];
}

// Payload Types
export interface StockAdjustmentPayload {
  warehouseId: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  reference?: string;
}

export interface AllocateStockPayload {
  warehouseId: string;
  binId: string;
  productId: string;
  quantity: number;
  reason?: string;
  reference?: string;
}

export interface DeallocateStockPayload {
  warehouseId: string;
  binId: string;
  productId: string;
  quantity: number;
  reason?: string;
  reference?: string;
}

export interface TransferStockPayload {
  warehouseId: string;
  productId: string;
  fromBinId: string;
  toBinId: string;
  quantity: number;
  reason?: string;
  reference?: string;
}

// Query Parameter Interfaces
export interface InventoryQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  productId?: string;
  warehouseId?: string;
  [key: string]: string | number | undefined;
}

export interface StockMovementQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  warehouseId?: string;
  productId?: string;
  type?: StockMovementType;
  reference?: string;
  createdById?: string;
  [key: string]: string | number | undefined;
}

export interface LocationStockQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  warehouseId?: string;
  productId?: string;
  binId?: string;
  [key: string]: string | number | undefined;
}

export interface LocationMovementQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  warehouseId?: string;
  productId?: string;
  type?: LocationMovementType;
  fromBinId?: string;
  toBinId?: string;
  reference?: string;
  createdById?: string;
  [key: string]: string | number | undefined;
}

// Generic API Responses
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
