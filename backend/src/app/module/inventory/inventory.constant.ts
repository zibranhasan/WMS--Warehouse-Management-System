// ===========================================================================
// Inventory — Searchable & filterable field definitions for QueryBuilder
// ===========================================================================

export const inventorySearchableFields: string[] = [
    "productId",
    "warehouseId",
    "product.name",
    "product.sku",
    "warehouse.name",
    "warehouse.code",
];

export const inventoryFilterableFields: string[] = [
    "warehouseId",
    "productId",
    "searchTerm",
];

export const stockMovementSearchableFields: string[] = [
    "productId",
    "warehouseId",
    "reason",
    "reference",
    "product.name",
    "product.sku",
    "warehouse.name",
    "warehouse.code",
];

export const stockMovementFilterableFields: string[] = [
    "warehouseId",
    "productId",
    "type",
    "reference",
    "createdById",
    "searchTerm",
];

export const inventoryLocationStockSearchableFields: string[] = [
    "productId",
    "warehouseId",
    "binId",
    "product.name",
    "product.sku",
    "bin.code",
    "bin.name",
];

export const inventoryLocationStockFilterableFields: string[] = [
    "warehouseId",
    "productId",
    "binId",
    "searchTerm",
];

export const inventoryLocationMovementSearchableFields: string[] = [
    "productId",
    "warehouseId",
    "binId",
    "fromBinId",
    "toBinId",
    "reason",
    "reference",
    "product.name",
    "product.sku",
];

export const inventoryLocationMovementFilterableFields: string[] = [
    "warehouseId",
    "productId",
    "type",
    "fromBinId",
    "toBinId",
    "reference",
    "createdById",
    "searchTerm",
];
