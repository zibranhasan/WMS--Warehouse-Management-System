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
