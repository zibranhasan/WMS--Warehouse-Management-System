import { StockMovementType } from "../../../generated/prisma/index.js";

// ---------------------------------------------------------------------------
// Stock Adjustment Payload
// ---------------------------------------------------------------------------

export interface IStockAdjustment {
    warehouseId: string;
    productId: string;
    quantity: number;
    type: StockMovementType;
    reason?: string;
    reference?: string;
}

// ---------------------------------------------------------------------------
// Inventory Filters
// ---------------------------------------------------------------------------

export interface IInventoryFilters {
    warehouseId?: string;
    productId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    searchTerm?: string;
}

export interface IStockMovementFilters {
    warehouseId?: string;
    productId?: string;
    type?: StockMovementType;
    createdById?: string;
    reference?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    searchTerm?: string;
}
