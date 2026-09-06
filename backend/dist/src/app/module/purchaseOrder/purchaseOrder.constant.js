// ===========================================================================
// Purchase Order — Searchable & filterable field definitions for QueryBuilder
// ===========================================================================
export const purchaseOrderSearchableFields = [
    "poNumber",
    "notes",
    "supplier.name",
    "supplier.code",
    "warehouse.name",
    "warehouse.code",
];
export const purchaseOrderFilterableFields = [
    "searchTerm",
    "supplierId",
    "warehouseId",
    "status",
    "createdById",
    "approvedById",
    "poNumber",
    "createdAt",
    "updatedAt",
];
