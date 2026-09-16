import { z } from "zod";
import { PaginatedResponse, SuccessResponse, ErrorResponse } from "../components/responses";
import { ProductResponse, WarehouseResponse, UserResponse } from "../components/schemas";
// ─── Response sub-schemas ─────────────────────────────────────────────
const InventoryStockResponse = z
    .object({
    warehouseId: z.string(),
    productId: z.string(),
    quantity: z.number(),
    warehouse: WarehouseResponse.optional(),
    product: ProductResponse.optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
})
    .openapi("InventoryStock");
const StockMovementResponse = z
    .object({
    id: z.string(),
    warehouseId: z.string(),
    productId: z.string(),
    type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
    quantity: z.number(),
    previousStock: z.number(),
    newStock: z.number(),
    reason: z.string().nullable().optional(),
    reference: z.string().nullable().optional(),
    createdById: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    warehouse: WarehouseResponse.optional(),
    product: ProductResponse.optional(),
    createdBy: UserResponse.optional(),
})
    .openapi("StockMovement");
const LocationHierarchyRef = z
    .object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
})
    .openapi("LocationHierarchyRef");
const InventoryLocationStockResponse = z
    .object({
    id: z.string(),
    warehouseId: z.string(),
    binId: z.string(),
    productId: z.string(),
    quantity: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    warehouse: WarehouseResponse.optional(),
    bin: z
        .object({
        id: z.string(),
        code: z.string(),
        name: z.string(),
        shelf: z
            .object({
            id: z.string(),
            code: z.string(),
            name: z.string(),
            aisle: z
                .object({
                id: z.string(),
                code: z.string(),
                name: z.string(),
                zone: LocationHierarchyRef.optional(),
            })
                .optional(),
        })
            .optional(),
    })
        .optional(),
    product: ProductResponse.optional(),
})
    .openapi("InventoryLocationStock");
const LocationMovementResponse = z
    .object({
    id: z.string(),
    warehouseId: z.string(),
    productId: z.string(),
    type: z.enum(["ALLOCATE", "DEALLOCATE", "TRANSFER"]),
    fromBinId: z.string().nullable().optional(),
    toBinId: z.string().nullable().optional(),
    quantity: z.number(),
    reason: z.string().nullable().optional(),
    reference: z.string().nullable().optional(),
    createdById: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
})
    .openapi("LocationMovement");
// ─── Named component schemas (extracted from inline) ─────────────────
const InventoryLocationItem = z
    .object({
    locationStockId: z.string(),
    quantity: z.number(),
    zone: LocationHierarchyRef.nullable(),
    aisle: LocationHierarchyRef.nullable(),
    shelf: LocationHierarchyRef.nullable(),
    bin: LocationHierarchyRef.nullable(),
})
    .openapi("InventoryLocationItem");
const InventorySummaryResponse = z
    .object({
    product: z.object({ id: z.string(), sku: z.string(), name: z.string(), unit: z.string() }),
    warehouse: z.object({ id: z.string(), code: z.string(), name: z.string() }),
    inventoryStock: z.number(),
    allocatedStock: z.number(),
    reservedStock: z.number(),
    availableStock: z.number(),
    unallocatedStock: z.number(),
    locations: z.array(InventoryLocationItem),
})
    .openapi("InventorySummaryResponse");
const BinStockProduct = z
    .object({
    id: z.string(),
    productId: z.string(),
    product: ProductResponse.optional(),
    quantity: z.number(),
})
    .openapi("BinStockProduct");
const BinStockResponse = z
    .object({
    bin: z.object({ id: z.string(), code: z.string(), name: z.string(), description: z.string().nullable().optional(), status: z.string() }),
    warehouse: WarehouseResponse.optional(),
    zone: LocationHierarchyRef.nullable(),
    aisle: LocationHierarchyRef.nullable(),
    shelf: LocationHierarchyRef.nullable(),
    capacity: z.number(),
    usedCapacity: z.number(),
    availableCapacity: z.number(),
    products: z.array(BinStockProduct),
})
    .openapi("BinStockResponse");
const ProductLocationEntry = z
    .object({
    id: z.string(),
    quantity: z.number(),
    zone: LocationHierarchyRef.nullable(),
    aisle: LocationHierarchyRef.nullable(),
    shelf: LocationHierarchyRef.nullable(),
    bin: LocationHierarchyRef,
})
    .openapi("ProductLocationEntry");
const ProductWarehouseLocations = z
    .object({
    warehouse: WarehouseResponse,
    locations: z.array(ProductLocationEntry),
})
    .openapi("ProductWarehouseLocations");
const ProductLocationsResponse = z
    .object({
    product: z.object({ id: z.string(), sku: z.string(), name: z.string(), unit: z.string() }),
    warehouseLocations: z.array(ProductWarehouseLocations),
})
    .openapi("ProductLocationsResponse");
// ─── Request schemas ─────────────────────────────────────────────────
const StockAdjustmentRequest = z
    .object({
    warehouseId: z.string().min(1),
    productId: z.string().min(1),
    type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
    quantity: z.number(),
    reason: z.string().optional(),
    reference: z.string().optional(),
})
    .openapi("StockAdjustmentRequest");
const AllocateStockRequest = z
    .object({
    warehouseId: z.string().min(1),
    binId: z.string().min(1),
    productId: z.string().min(1),
    quantity: z.number().gt(0),
    reason: z.string().optional(),
    reference: z.string().optional(),
})
    .openapi("AllocateStockRequest");
const DeallocateStockRequest = z
    .object({
    warehouseId: z.string().min(1),
    binId: z.string().min(1),
    productId: z.string().min(1),
    quantity: z.number().gt(0),
    reason: z.string().optional(),
    reference: z.string().optional(),
})
    .openapi("DeallocateStockRequest");
const TransferStockRequest = z
    .object({
    warehouseId: z.string().min(1),
    productId: z.string().min(1),
    fromBinId: z.string().min(1),
    toBinId: z.string().min(1),
    quantity: z.number().gt(0),
    reason: z.string().optional(),
    reference: z.string().optional(),
})
    .openapi("TransferStockRequest");
// ─── Query schemas ───────────────────────────────────────────────────
const WarehouseStockQuery = z
    .object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    searchTerm: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
    warehouseId: z.string().optional(),
    productId: z.string().optional(),
})
    .openapi("WarehouseStockQuery");
const StockMovementsQuery = z
    .object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    searchTerm: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
    warehouseId: z.string().optional(),
    productId: z.string().optional(),
    type: z.enum(["IN", "OUT", "ADJUSTMENT"]).optional(),
    reference: z.string().optional(),
    createdById: z.string().optional(),
})
    .openapi("StockMovementsQuery");
const WarehouseLocationStockQuery = z
    .object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    searchTerm: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
    warehouseId: z.string().optional(),
    productId: z.string().optional(),
    binId: z.string().optional(),
})
    .openapi("WarehouseLocationStockQuery");
const LocationMovementsQuery = z
    .object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    searchTerm: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
    warehouseId: z.string().optional(),
    productId: z.string().optional(),
    type: z.enum(["ALLOCATE", "DEALLOCATE", "TRANSFER"]).optional(),
    fromBinId: z.string().optional(),
    toBinId: z.string().optional(),
    reference: z.string().optional(),
    createdById: z.string().optional(),
})
    .openapi("LocationMovementsQuery");
// ─── Register paths ──────────────────────────────────────────────────
export function registerInventoryPaths(registry) {
    registry.registerComponent("schemas", "InventoryStock", InventoryStockResponse);
    registry.registerComponent("schemas", "StockMovement", StockMovementResponse);
    registry.registerComponent("schemas", "InventoryLocationStock", InventoryLocationStockResponse);
    registry.registerComponent("schemas", "LocationMovement", LocationMovementResponse);
    registry.registerComponent("schemas", "StockAdjustmentRequest", StockAdjustmentRequest);
    registry.registerComponent("schemas", "AllocateStockRequest", AllocateStockRequest);
    registry.registerComponent("schemas", "DeallocateStockRequest", DeallocateStockRequest);
    registry.registerComponent("schemas", "TransferStockRequest", TransferStockRequest);
    registry.registerComponent("schemas", "InventorySummaryResponse", InventorySummaryResponse);
    registry.registerComponent("schemas", "BinStockResponse", BinStockResponse);
    registry.registerComponent("schemas", "ProductLocationsResponse", ProductLocationsResponse);
    // ─── READ: Warehouse stock ────────────────────────────────────────
    // 1. GET /api/v1/inventory/warehouse/:warehouseId
    registry.registerPath({
        method: "get",
        path: "/api/v1/inventory/warehouse/{warehouseId}",
        operationId: "getWarehouseStock",
        tags: ["Inventory"],
        summary: "Get warehouse stock",
        description: "Retrieves a paginated list of inventory stock records for a specific warehouse. Includes warehouse and product details. Warehouse-scoped users are restricted to their assigned warehouse.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ warehouseId: z.string().describe("Warehouse ID") }),
            query: WarehouseStockQuery,
        },
        responses: {
            200: {
                description: "Warehouse stock fetched successfully",
                content: { "application/json": { schema: PaginatedResponse(InventoryStockResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Warehouse not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── READ: Inventory summary ──────────────────────────────────────
    // 2. GET /api/v1/inventory/warehouse/:warehouseId/product/:productId/summary
    registry.registerPath({
        method: "get",
        path: "/api/v1/inventory/warehouse/{warehouseId}/product/{productId}/summary",
        operationId: "getInventorySummary",
        tags: ["Inventory"],
        summary: "Get inventory summary",
        description: "Retrieves the full inventory summary for a product within a warehouse. Includes total stock, allocated stock, reserved stock, available stock, unallocated stock, and per-bin location breakdown sorted by zone/aisle/shelf/bin hierarchy. Warehouse-scoped users are restricted to their assigned warehouse.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({
                warehouseId: z.string().describe("Warehouse ID"),
                productId: z.string().describe("Product ID"),
            }),
        },
        responses: {
            200: {
                description: "Inventory summary fetched successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(InventorySummaryResponse),
                    },
                },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Warehouse or product not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── READ: Product stock in warehouse ─────────────────────────────
    // 3. GET /api/v1/inventory/warehouse/:warehouseId/product/:productId
    registry.registerPath({
        method: "get",
        path: "/api/v1/inventory/warehouse/{warehouseId}/product/{productId}",
        operationId: "getProductStock",
        tags: ["Inventory"],
        summary: "Get product stock in warehouse",
        description: "Retrieves the stock record for a specific product in a specific warehouse. Returns the current quantity. Warehouse-scoped users are restricted to their assigned warehouse.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({
                warehouseId: z.string().describe("Warehouse ID"),
                productId: z.string().describe("Product ID"),
            }),
        },
        responses: {
            200: {
                description: "Product stock fetched successfully",
                content: { "application/json": { schema: SuccessResponse(InventoryStockResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Warehouse, product, or stock record not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── WRITE: Adjust stock ──────────────────────────────────────────
    // 4. POST /api/v1/inventory/adjust
    registry.registerPath({
        method: "post",
        path: "/api/v1/inventory/adjust",
        operationId: "adjustStock",
        tags: ["Inventory"],
        summary: "Adjust stock",
        description: "Adjusts stock for a product in a warehouse. Supports three movement types: IN (add stock), OUT (remove stock), and ADJUSTMENT (signed correction). For IN/OUT, quantity must be positive. For ADJUSTMENT, quantity can be positive or negative (but not zero). Stock quantity cannot go below zero. Uses row-level locking on the inventory_stocks record within a transaction to prevent race conditions. Creates an immutable StockMovement audit record.",
        security: [{ cookieAuth: [] }],
        request: {
            body: { content: { "application/json": { schema: StockAdjustmentRequest } } },
        },
        responses: {
            200: {
                description: "Stock adjusted successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(z.object({
                            stock: InventoryStockResponse,
                            movement: StockMovementResponse,
                        })),
                    },
                },
            },
            400: { description: "Validation error, insufficient stock, or inactive warehouse/product", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — requires SUPER_ADMIN, ADMIN, or WAREHOUSE_MANAGER role", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Warehouse or product not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── READ: Stock movements ────────────────────────────────────────
    // 5. GET /api/v1/inventory/movements
    registry.registerPath({
        method: "get",
        path: "/api/v1/inventory/movements",
        operationId: "getStockMovements",
        tags: ["Inventory"],
        summary: "Get stock movements",
        description: "Retrieves a paginated audit trail of all stock movements (IN, OUT, ADJUSTMENT). Includes warehouse, product, and user who created the movement. Warehouse-scoped users see only movements for their assigned warehouse. Global roles (SUPER_ADMIN, ADMIN) see all warehouses.",
        security: [{ cookieAuth: [] }],
        request: { query: StockMovementsQuery },
        responses: {
            200: {
                description: "Stock movements fetched successfully",
                content: { "application/json": { schema: PaginatedResponse(StockMovementResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── READ: Product movements ──────────────────────────────────────
    // 6. GET /api/v1/inventory/product/:productId/movements
    registry.registerPath({
        method: "get",
        path: "/api/v1/inventory/product/{productId}/movements",
        operationId: "getProductMovements",
        tags: ["Inventory"],
        summary: "Get product movements",
        description: "Retrieves a paginated audit trail of stock movements for a specific product. Warehouse-scoped users see only movements within their assigned warehouse.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ productId: z.string().describe("Product ID") }),
            query: StockMovementsQuery,
        },
        responses: {
            200: {
                description: "Product movements fetched successfully",
                content: { "application/json": { schema: PaginatedResponse(StockMovementResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Product not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── WRITE: Allocate stock to bin ─────────────────────────────────
    // 7. POST /api/v1/inventory/locations/allocate
    registry.registerPath({
        method: "post",
        path: "/api/v1/inventory/locations/allocate",
        operationId: "allocateStockToBin",
        tags: ["Inventory"],
        summary: "Allocate stock to bin",
        description: "Allocates stock from the warehouse-level pool to a specific bin. Validates: warehouse and product are ACTIVE, bin hierarchy is ACTIVE and belongs to the specified warehouse, sufficient unallocated stock exists, and bin capacity is not exceeded. Does not use FOR UPDATE row locking on inventory_location_stocks. Creates an ALLOCATE audit record in InventoryLocationMovement.",
        security: [{ cookieAuth: [] }],
        request: {
            body: { content: { "application/json": { schema: AllocateStockRequest } } },
        },
        responses: {
            201: {
                description: "Stock allocated to bin successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(z.object({
                            locationStock: InventoryLocationStockResponse,
                            movement: LocationMovementResponse,
                        })),
                    },
                },
            },
            400: { description: "Validation error, insufficient stock, or bin capacity exceeded", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — requires SUPER_ADMIN, ADMIN, or WAREHOUSE_MANAGER role", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Warehouse, product, or bin not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── WRITE: Deallocate stock from bin ─────────────────────────────
    // 8. POST /api/v1/inventory/locations/deallocate
    registry.registerPath({
        method: "post",
        path: "/api/v1/inventory/locations/deallocate",
        operationId: "deallocateStockFromBin",
        tags: ["Inventory"],
        summary: "Deallocate stock from bin",
        description: "Removes stock from a specific bin back to the warehouse-level pool. Validates: warehouse is ACTIVE, bin hierarchy is ACTIVE and belongs to the warehouse, and the bin has sufficient stock. Does not use FOR UPDATE row locking on inventory_location_stocks. Creates a DEALLOCATE audit record in InventoryLocationMovement.",
        security: [{ cookieAuth: [] }],
        request: {
            body: { content: { "application/json": { schema: DeallocateStockRequest } } },
        },
        responses: {
            200: {
                description: "Stock deallocated from bin successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(z.object({
                            locationStock: InventoryLocationStockResponse,
                            movement: LocationMovementResponse,
                        })),
                    },
                },
            },
            400: { description: "Validation error or insufficient stock in bin", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — requires SUPER_ADMIN, ADMIN, or WAREHOUSE_MANAGER role", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Warehouse, product, or bin not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── WRITE: Transfer stock between bins ───────────────────────────
    // 9. POST /api/v1/inventory/locations/transfer
    registry.registerPath({
        method: "post",
        path: "/api/v1/inventory/locations/transfer",
        operationId: "transferStockBetweenBins",
        tags: ["Inventory"],
        summary: "Transfer stock between bins",
        description: "Transfers stock from one bin to another within the same warehouse. Source and destination bins must be different. Validates: warehouse and product are ACTIVE, both bins have valid ACTIVE hierarchies within the warehouse, source bin has sufficient stock, and destination bin capacity is not exceeded. Does not use FOR UPDATE row locking on inventory_location_stocks. Creates a TRANSFER audit record in InventoryLocationMovement.",
        security: [{ cookieAuth: [] }],
        request: {
            body: { content: { "application/json": { schema: TransferStockRequest } } },
        },
        responses: {
            200: {
                description: "Stock transferred between bins successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(z.object({
                            fromBinStock: InventoryLocationStockResponse,
                            toBinStock: InventoryLocationStockResponse,
                            movement: LocationMovementResponse,
                        })),
                    },
                },
            },
            400: { description: "Validation error, insufficient source stock, same bin, or destination capacity exceeded", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — requires SUPER_ADMIN, ADMIN, or WAREHOUSE_MANAGER role", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Warehouse, product, or bin not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── READ: Bin stock & capacity ───────────────────────────────────
    // 10. GET /api/v1/inventory/locations/bin/:binId
    registry.registerPath({
        method: "get",
        path: "/api/v1/inventory/locations/bin/{binId}",
        operationId: "getBinStock",
        tags: ["Inventory"],
        summary: "Get bin stock and capacity",
        description: "Retrieves the stock and capacity information for a specific bin. Returns the bin's full location hierarchy (zone, aisle, shelf), capacity, used capacity, available capacity, and a list of products currently stored in the bin.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ binId: z.string().describe("Bin ID") }),
        },
        responses: {
            200: {
                description: "Bin stock fetched successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(BinStockResponse),
                    },
                },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no bin warehouse access", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Bin not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── READ: Product locations ──────────────────────────────────────
    // 11. GET /api/v1/inventory/locations/product/:productId
    registry.registerPath({
        method: "get",
        path: "/api/v1/inventory/locations/product/{productId}",
        operationId: "getProductLocations",
        tags: ["Inventory"],
        summary: "Get product locations",
        description: "Retrieves all bin locations where a product is currently stored (quantity > 0), grouped by warehouse. Each location includes the full hierarchy (zone, aisle, shelf, bin). Warehouse-scoped users see only locations within their assigned warehouse.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ productId: z.string().describe("Product ID") }),
        },
        responses: {
            200: {
                description: "Product locations fetched successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(ProductLocationsResponse),
                    },
                },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Product not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── READ: Warehouse location stock ───────────────────────────────
    // 12. GET /api/v1/inventory/locations/warehouse/:warehouseId
    registry.registerPath({
        method: "get",
        path: "/api/v1/inventory/locations/warehouse/{warehouseId}",
        operationId: "getWarehouseLocationStock",
        tags: ["Inventory"],
        summary: "Get warehouse location stock",
        description: "Retrieves a paginated list of all inventory location stock records (bin-level allocations) for a warehouse. Includes product, bin, and hierarchy details. Warehouse-scoped users are restricted to their assigned warehouse.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ warehouseId: z.string().describe("Warehouse ID") }),
            query: WarehouseLocationStockQuery,
        },
        responses: {
            200: {
                description: "Warehouse location stock fetched successfully",
                content: { "application/json": { schema: PaginatedResponse(InventoryLocationStockResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Warehouse not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── READ: Location movements ─────────────────────────────────────
    // 13. GET /api/v1/inventory/locations/movements
    registry.registerPath({
        method: "get",
        path: "/api/v1/inventory/locations/movements",
        operationId: "getLocationMovements",
        tags: ["Inventory"],
        summary: "Get location movements",
        description: "Retrieves a paginated audit trail of location-level stock movements (ALLOCATE, DEALLOCATE, TRANSFER). Warehouse-scoped users see only movements within their assigned warehouse.",
        security: [{ cookieAuth: [] }],
        request: { query: LocationMovementsQuery },
        responses: {
            200: {
                description: "Location movements fetched successfully",
                content: { "application/json": { schema: PaginatedResponse(LocationMovementResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
}
