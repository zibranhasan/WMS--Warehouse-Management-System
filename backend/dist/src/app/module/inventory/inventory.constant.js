// ===========================================================================
// Inventory — Searchable & filterable field definitions for QueryBuilder
// ===========================================================================
export const inventorySearchableFields = [
    "productId",
    "warehouseId",
    "product.name",
    "product.sku",
    "warehouse.name",
    "warehouse.code",
];
export const inventoryFilterableFields = [
    "warehouseId",
    "productId",
    "searchTerm",
];
export const stockMovementSearchableFields = [
    "productId",
    "warehouseId",
    "reason",
    "reference",
    "product.name",
    "product.sku",
    "warehouse.name",
    "warehouse.code",
];
export const stockMovementFilterableFields = [
    "warehouseId",
    "productId",
    "type",
    "reference",
    "createdById",
    "searchTerm",
];
export const inventoryLocationStockSearchableFields = [
    "productId",
    "warehouseId",
    "binId",
    "product.name",
    "product.sku",
    "bin.code",
    "bin.name",
];
export const inventoryLocationStockFilterableFields = [
    "warehouseId",
    "productId",
    "binId",
    "searchTerm",
];
export const inventoryLocationMovementSearchableFields = [
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
export const inventoryLocationMovementFilterableFields = [
    "warehouseId",
    "productId",
    "type",
    "fromBinId",
    "toBinId",
    "reference",
    "createdById",
    "searchTerm",
];
