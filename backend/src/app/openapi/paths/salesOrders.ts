import { z } from "zod";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { PaginatedResponse, SuccessResponse, ErrorResponse } from "../components/responses";
import { WarehouseResponse, ProductResponse } from "../components/schemas";

// ─── Response sub-schemas ─────────────────────────────────────────────

const SOUserRef = z
    .object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        role: z.string(),
    })
    .openapi("SOUserRef");

const StockReservationResponse = z
    .object({
        id: z.string(),
        salesOrderId: z.string(),
        salesOrderItemId: z.string(),
        warehouseId: z.string(),
        productId: z.string(),
        quantity: z.number(),
        status: z.enum(["ACTIVE", "RELEASED", "CONSUMED"]),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .openapi("StockReservation");

const SalesOrderItemResponse = z
    .object({
        id: z.string(),
        salesOrderId: z.string(),
        productId: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        totalPrice: z.number(),
        reservedQuantity: z.number(),
        createdAt: z.string(),
        updatedAt: z.string(),
        product: ProductResponse.optional(),
    })
    .openapi("SalesOrderItem");

const SalesOrderResponse = z
    .object({
        id: z.string(),
        orderNumber: z.string(),
        createdById: z.string(),
        warehouseId: z.string(),
        status: z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]),
        totalAmount: z.number(),
        notes: z.string().nullable().optional(),
        cancellationReason: z.string().nullable().optional(),
        createdAt: z.string(),
        updatedAt: z.string(),
        warehouse: WarehouseResponse.optional(),
        createdBy: SOUserRef.optional(),
        items: z.array(SalesOrderItemResponse).optional(),
        reservations: z.array(StockReservationResponse).optional(),
    })
    .openapi("SalesOrder");

// ─── Request schemas ─────────────────────────────────────────────────

const SalesOrderItemRequest = z
    .object({
        productId: z.string().min(1),
        quantity: z.number().gt(0),
        unitPrice: z.number().gt(0),
    })
    .openapi("SalesOrderItemRequest");

const CreateSalesOrderRequest = z
    .object({
        warehouseId: z.string().min(1),
        notes: z.string().nullable().optional(),
        items: z.array(SalesOrderItemRequest).min(1),
    })
    .openapi("CreateSalesOrderRequest");

const CancelSalesOrderRequest = z
    .object({
        cancellationReason: z.string().min(1),
    })
    .openapi("CancelSalesOrderRequest");

// ─── Query schemas ───────────────────────────────────────────────────

const SalesOrderListQuery = z
    .object({
        page: z.coerce.number().int().min(1).default(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
        searchTerm: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
        warehouseId: z.string().optional(),
        createdById: z.string().optional(),
        status: z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
    })
    .openapi("SalesOrderListQuery");

// ─── Register paths ──────────────────────────────────────────────────

export function registerSalesOrderPaths(registry: OpenAPIRegistry) {
    registry.registerComponent("schemas", "SalesOrder", SalesOrderResponse as never);
    registry.registerComponent("schemas", "SalesOrderItem", SalesOrderItemResponse as never);
    registry.registerComponent("schemas", "StockReservation", StockReservationResponse as never);
    registry.registerComponent("schemas", "CreateSalesOrderRequest", CreateSalesOrderRequest as never);
    registry.registerComponent("schemas", "CancelSalesOrderRequest", CancelSalesOrderRequest as never);

    // ─── CREATE ───────────────────────────────────────────────────────

    // 1. POST /api/v1/sales-orders
    registry.registerPath({
        method: "post",
        path: "/api/v1/sales-orders",
        operationId: "createSalesOrder",
        tags: ["Sales Orders"],
        summary: "Create sales order",
        description:
            "Creates a new sales order with items. Generates a unique order number (e.g. SO-2026-000001). Validates warehouse (must be ACTIVE), products (must exist, not deleted, ACTIVE), and quantities/prices (> 0). No duplicate products allowed. Totals are calculated server-side. Executes an atomic transaction with FOR UPDATE row locking on inventory_stocks and checks available stock for every item before creation. Status is set to CONFIRMED. Creates ACTIVE StockReservation records for each item (reserves available stock without deducting physical inventory). Sends notification to Warehouse Manager(s) for the assigned warehouse. Requires SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER, or STAFF role.",
        security: [{ cookieAuth: [] }],
        request: {
            body: { content: { "application/json": { schema: CreateSalesOrderRequest } } },
        },
        responses: {
            201: {
                description: "Sales order created successfully",
                content: { "application/json": { schema: SuccessResponse(SalesOrderResponse) } },
            },
            400: { description: "Validation error, duplicate products, inactive warehouse/product, or insufficient available stock", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — requires SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER, or STAFF role", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Warehouse or product not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── LIST ─────────────────────────────────────────────────────────

    // 2. GET /api/v1/sales-orders
    registry.registerPath({
        method: "get",
        path: "/api/v1/sales-orders",
        operationId: "listSalesOrders",
        tags: ["Sales Orders"],
        summary: "List sales orders",
        description:
            "Retrieves a paginated list of sales orders with warehouse, createdBy, items (with product), and reservations included. Warehouse-scoped users (non-SUPER_ADMIN/ADMIN) see only SOs for their assigned warehouse. Supports search by orderNumber and notes. Filterable by warehouseId, createdById, status, createdAt, and updatedAt.",
        security: [{ cookieAuth: [] }],
        request: { query: SalesOrderListQuery },
        responses: {
            200: {
                description: "Sales orders fetched successfully",
                content: { "application/json": { schema: PaginatedResponse(SalesOrderResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── GET BY ID ────────────────────────────────────────────────────

    // 3. GET /api/v1/sales-orders/:id
    registry.registerPath({
        method: "get",
        path: "/api/v1/sales-orders/{id}",
        operationId: "getSalesOrderById",
        tags: ["Sales Orders"],
        summary: "Get sales order by ID",
        description:
            "Retrieves a single sales order with full details: warehouse, createdBy, items (with product), and reservations. Warehouse access is validated via checkSoWarehouseAccess.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Sales Order ID") }),
        },
        responses: {
            200: {
                description: "Sales order retrieved successfully",
                content: { "application/json": { schema: SuccessResponse(SalesOrderResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Sales order not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── CANCEL ───────────────────────────────────────────────────────

    // 4. PATCH /api/v1/sales-orders/:id/cancel
    registry.registerPath({
        method: "patch",
        path: "/api/v1/sales-orders/{id}/cancel",
        operationId: "cancelSalesOrder",
        tags: ["Sales Orders"],
        summary: "Cancel sales order",
        description:
            "Cancels a CONFIRMED sales order. Only CONFIRMED orders can be cancelled. Already cancelled orders return an error. Within a transaction: releases all ACTIVE StockReservation records (sets status to RELEASED), clears reservedQuantity on SalesOrderItems to 0, and updates the SalesOrder status to CANCELLED with the provided cancellationReason. Sends a WARNING notification to the SO creator. Requires SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER, or STAFF role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Sales Order ID") }),
            body: { content: { "application/json": { schema: CancelSalesOrderRequest } } },
        },
        responses: {
            200: {
                description: "Sales order cancelled successfully",
                content: { "application/json": { schema: SuccessResponse(SalesOrderResponse) } },
            },
            400: { description: "Already cancelled or not CONFIRMED", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access or insufficient role", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Sales order not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
}
