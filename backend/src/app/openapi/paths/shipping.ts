import { z } from "zod";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { PaginatedResponse, SuccessResponse, ErrorResponse } from "../components/responses";
import { WarehouseResponse, SalesOrderSummary } from "../components/schemas";

// ─── Response sub-schemas ─────────────────────────────────────────────

const ShippingUserRef = z
    .object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        role: z.string(),
    })
    .openapi("ShippingUserRef");

const ShipmentResponse = z
    .object({
        id: z.string(),
        shipmentNumber: z.string(),
        salesOrderId: z.string(),
        warehouseId: z.string(),
        status: z.enum(["READY", "SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED"]),
        shippingMethod: z.enum(["STANDARD", "EXPRESS", "SAME_DAY", "PICKUP"]),
        carrier: z.string().nullable().optional(),
        trackingNumber: z.string().nullable().optional(),
        shippingAddress: z.string(),
        shippingCity: z.string(),
        shippingCountry: z.string(),
        shippingPhone: z.string(),
        shippedAt: z.string().nullable().optional(),
        deliveredAt: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        createdAt: z.string(),
        updatedAt: z.string(),
        warehouse: WarehouseResponse.optional(),
        salesOrder: SalesOrderSummary.optional(),
    })
    .openapi("Shipment");

// ─── Request schemas ─────────────────────────────────────────────────

const CreateShipmentRequest = z
    .object({
        salesOrderId: z.string().min(1),
        shippingMethod: z.enum(["STANDARD", "EXPRESS", "SAME_DAY", "PICKUP"]),
        shippingAddress: z.string().min(1),
        shippingCity: z.string().min(1),
        shippingCountry: z.string().min(1),
        shippingPhone: z.string().min(1),
        carrier: z.string().optional(),
        trackingNumber: z.string().optional(),
        notes: z.string().optional(),
    })
    .openapi("CreateShipmentRequest");

const UpdateShipmentRequest = z
    .object({
        shippingMethod: z.enum(["STANDARD", "EXPRESS", "SAME_DAY", "PICKUP"]).optional(),
        carrier: z.string().optional(),
        trackingNumber: z.string().optional(),
        shippingAddress: z.string().min(1).optional(),
        shippingCity: z.string().min(1).optional(),
        shippingCountry: z.string().min(1).optional(),
        shippingPhone: z.string().min(1).optional(),
        notes: z.string().optional(),
    })
    .openapi("UpdateShipmentRequest");

const UpdateShipmentStatusRequest = z
    .object({
        status: z.enum(["READY", "SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED"]),
    })
    .openapi("UpdateShipmentStatusRequest");

// ─── Query schemas ───────────────────────────────────────────────────

const ShippingListQuery = z
    .object({
        page: z.coerce.number().int().min(1).default(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
        searchTerm: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
        status: z.enum(["READY", "SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED"]).optional(),
        shippingMethod: z.enum(["STANDARD", "EXPRESS", "SAME_DAY", "PICKUP"]).optional(),
        warehouseId: z.string().optional(),
        salesOrderId: z.string().optional(),
        carrier: z.string().optional(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
    })
    .openapi("ShippingListQuery");

// ─── Register paths ──────────────────────────────────────────────────

export function registerShippingPaths(registry: OpenAPIRegistry) {
    registry.registerComponent("schemas", "Shipment", ShipmentResponse as never);
    registry.registerComponent("schemas", "CreateShipmentRequest", CreateShipmentRequest as never);
    registry.registerComponent("schemas", "UpdateShipmentRequest", UpdateShipmentRequest as never);
    registry.registerComponent("schemas", "UpdateShipmentStatusRequest", UpdateShipmentStatusRequest as never);

    // ─── CREATE SHIPMENT ──────────────────────────────────────────────

    // 1. POST /api/v1/shipping
    registry.registerPath({
        method: "post",
        path: "/api/v1/shipping",
        operationId: "createShipment",
        tags: ["Shipping"],
        summary: "Create shipment",
        description:
            "Creates a shipment for a Sales Order. Validates the Sales Order exists, is not CANCELLED, has an associated PackingTask with status PACKED, and all packing items are fully packed. Prevents duplicate shipments per Sales Order (1:1 relationship). Generates a unique shipment number (e.g. SHIP-2026-000001). Sets initial status to READY and updates the Sales Order status to SHIPPED. Sends notification to Warehouse Manager(s). Requires SUPER_ADMIN, ADMIN, or WAREHOUSE_MANAGER role.",
        security: [{ cookieAuth: [] }],
        request: {
            body: { content: { "application/json": { schema: CreateShipmentRequest } } },
        },
        responses: {
            201: {
                description: "Shipment created successfully",
                content: { "application/json": { schema: SuccessResponse(ShipmentResponse) } },
            },
            400: { description: "Validation error, Sales Order cancelled, packing not complete, or duplicate shipment", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — requires SUPER_ADMIN, ADMIN, or WAREHOUSE_MANAGER role", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Sales Order not found", content: { "application/json": { schema: ErrorResponse } } },
            409: { description: "Shipment already exists for this sales order", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── LIST SHIPMENTS ───────────────────────────────────────────────

    // 2. GET /api/v1/shipping
    registry.registerPath({
        method: "get",
        path: "/api/v1/shipping",
        operationId: "listShipments",
        tags: ["Shipping"],
        summary: "List shipments",
        description:
            "Retrieves a paginated list of shipments with warehouse and salesOrder (with createdBy and items/product) included. Warehouse-scoped users (non-SUPER_ADMIN/ADMIN) see only shipments for their assigned warehouse. Supports search by shipmentNumber, trackingNumber, and carrier. Filterable by status, shippingMethod, warehouseId, salesOrderId, carrier, createdAt, and updatedAt.",
        security: [{ cookieAuth: [] }],
        request: { query: ShippingListQuery },
        responses: {
            200: {
                description: "Shipments fetched successfully",
                content: { "application/json": { schema: PaginatedResponse(ShipmentResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── GET SHIPMENT BY SALES ORDER ───────────────────────────────────

    // 3. GET /api/v1/shipping/sales-order/:salesOrderId
    registry.registerPath({
        method: "get",
        path: "/api/v1/shipping/sales-order/{salesOrderId}",
        operationId: "getShipmentBySalesOrder",
        tags: ["Shipping"],
        summary: "Get shipment by Sales Order",
        description:
            "Retrieves the shipment associated with a specific Sales Order. Returns the full shipment detail including warehouse, salesOrder, shipping information, and timestamps. Warehouse access is validated via checkSoParamsWarehouseAccess.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ salesOrderId: z.string().describe("Sales Order ID") }),
        },
        responses: {
            200: {
                description: "Shipment retrieved for sales order successfully",
                content: { "application/json": { schema: SuccessResponse(ShipmentResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Shipment not found for the specified Sales Order", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── GET SHIPMENT BY ID ───────────────────────────────────────────

    // 4. GET /api/v1/shipping/:id
    registry.registerPath({
        method: "get",
        path: "/api/v1/shipping/{id}",
        operationId: "getShipmentById",
        tags: ["Shipping"],
        summary: "Get shipment by ID",
        description:
            "Retrieves a single shipment with full details: warehouse, salesOrder (with createdBy and items/product), shipping information, and timestamps. Warehouse access is validated via checkShipmentWarehouseAccess.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Shipment ID") }),
        },
        responses: {
            200: {
                description: "Shipment details retrieved successfully",
                content: { "application/json": { schema: SuccessResponse(ShipmentResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Shipment not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── UPDATE SHIPMENT INFO ─────────────────────────────────────────

    // 5. PATCH /api/v1/shipping/:id
    registry.registerPath({
        method: "patch",
        path: "/api/v1/shipping/{id}",
        operationId: "updateShipment",
        tags: ["Shipping"],
        summary: "Update shipment information",
        description:
            "Updates shipment information (shipping method, carrier, tracking number, address, city, country, phone, notes). Only allowed when shipment status is READY. All fields are optional; only provided fields are updated. Warehouse access is validated via checkShipmentWarehouseAccess. Requires SUPER_ADMIN, ADMIN, or WAREHOUSE_MANAGER role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Shipment ID") }),
            body: { content: { "application/json": { schema: UpdateShipmentRequest } } },
        },
        responses: {
            200: {
                description: "Shipment information updated successfully",
                content: { "application/json": { schema: SuccessResponse(ShipmentResponse) } },
            },
            400: { description: "Cannot update when status is not READY", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access or insufficient role", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Shipment not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── UPDATE SHIPMENT STATUS ───────────────────────────────────────

    // 6. PATCH /api/v1/shipping/:id/status
    registry.registerPath({
        method: "patch",
        path: "/api/v1/shipping/{id}/status",
        operationId: "updateShipmentStatus",
        tags: ["Shipping"],
        summary: "Update shipment status",
        description:
            "Updates the status of a shipment. Allowed transitions: READY → SHIPPED, READY → CANCELLED, SHIPPED → IN_TRANSIT, IN_TRANSIT → DELIVERED. DELIVERED and CANCELLED are terminal states. When transitioning to SHIPPED, the shippedAt timestamp is automatically set. When transitioning to DELIVERED, the deliveredAt timestamp is automatically set. Transitions to SHIPPED and DELIVERED also update the associated Sales Order status accordingly. Sends notifications to the Sales Order creator for each status transition. Warehouse access is validated via checkShipmentWarehouseAccess. Requires SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER, or STAFF role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Shipment ID") }),
            body: { content: { "application/json": { schema: UpdateShipmentStatusRequest } } },
        },
        responses: {
            200: {
                description: "Shipment status updated successfully",
                content: { "application/json": { schema: SuccessResponse(ShipmentResponse) } },
            },
            400: { description: "Invalid status transition, already at target status, or terminal state", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access or insufficient role", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Shipment not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
}
