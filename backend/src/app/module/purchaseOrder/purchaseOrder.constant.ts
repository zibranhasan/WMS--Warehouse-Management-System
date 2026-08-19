// ===========================================================================
// Purchase Order — Searchable & filterable field definitions for QueryBuilder
// ===========================================================================

export const purchaseOrderSearchableFields: string[] = [
    "poNumber",
    "notes",
    "supplier.name",
    "supplier.code",
    "warehouse.name",
    "warehouse.code",
];

export const purchaseOrderFilterableFields: string[] = [
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
