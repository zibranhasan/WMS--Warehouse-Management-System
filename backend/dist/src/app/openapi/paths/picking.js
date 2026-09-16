import { z } from "zod";
import { PaginatedResponse, SuccessResponse, ErrorResponse } from "../components/responses";
import { WarehouseResponse, ProductResponse, SalesOrderSummary } from "../components/schemas";
// ─── Response sub-schemas ─────────────────────────────────────────────
const PickingUserRef = z
    .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.string(),
})
    .openapi("PickingUserRef");
const PickingTaskItemResponse = z
    .object({
    id: z.string(),
    pickingTaskId: z.string(),
    salesOrderItemId: z.string(),
    productId: z.string(),
    requiredQuantity: z.number(),
    pickedQuantity: z.number(),
    status: z.enum(["PENDING", "PARTIALLY_PICKED", "PICKED"]),
    createdAt: z.string(),
    updatedAt: z.string(),
    product: ProductResponse.optional(),
})
    .openapi("PickingTaskItem");
const PickingTaskResponse = z
    .object({
    id: z.string(),
    pickingNumber: z.string(),
    salesOrderId: z.string(),
    warehouseId: z.string(),
    assignedToId: z.string().nullable().optional(),
    status: z.enum(["PENDING", "ASSIGNED", "IN_PROGRESS", "PARTIALLY_PICKED", "PICKED", "CANCELLED"]),
    createdAt: z.string(),
    updatedAt: z.string(),
    warehouse: WarehouseResponse.optional(),
    salesOrder: SalesOrderSummary.optional(),
    assignedTo: PickingUserRef.nullable().optional(),
    items: z.array(PickingTaskItemResponse).optional(),
})
    .openapi("PickingTask");
const PickingAllocationLocationRef = z
    .object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
})
    .openapi("PickingAllocationLocationRef");
const PickingAllocationResponse = z
    .object({
    id: z.string(),
    quantity: z.number(),
    pickedAt: z.string(),
    pickedBy: PickingUserRef.optional(),
    locationStockId: z.string(),
    bin: PickingAllocationLocationRef.nullable().optional(),
    shelf: PickingAllocationLocationRef.nullable().optional(),
    aisle: PickingAllocationLocationRef.nullable().optional(),
    zone: PickingAllocationLocationRef.nullable().optional(),
})
    .openapi("PickingAllocation");
const PickingTaskItemDetailResponse = z
    .object({
    id: z.string(),
    pickingTaskId: z.string(),
    salesOrderItemId: z.string(),
    productId: z.string(),
    requiredQuantity: z.number(),
    pickedQuantity: z.number(),
    remainingQuantity: z.number(),
    status: z.enum(["PENDING", "PARTIALLY_PICKED", "PICKED"]),
    createdAt: z.string(),
    updatedAt: z.string(),
    product: ProductResponse.optional(),
    allocations: z.array(PickingAllocationResponse).optional(),
})
    .openapi("PickingTaskItemDetail");
const PickingTaskDetailResponse = z
    .object({
    id: z.string(),
    pickingNumber: z.string(),
    salesOrderId: z.string(),
    warehouseId: z.string(),
    assignedToId: z.string().nullable().optional(),
    status: z.enum(["PENDING", "ASSIGNED", "IN_PROGRESS", "PARTIALLY_PICKED", "PICKED", "CANCELLED"]),
    createdAt: z.string(),
    updatedAt: z.string(),
    warehouse: WarehouseResponse.optional(),
    salesOrder: SalesOrderSummary.optional(),
    assignedTo: PickingUserRef.nullable().optional(),
    items: z.array(PickingTaskItemDetailResponse).optional(),
})
    .openapi("PickingTaskDetail");
// ─── Request schemas ─────────────────────────────────────────────────
const CreatePickingTaskRequest = z
    .object({
    salesOrderId: z.string().min(1),
})
    .openapi("CreatePickingTaskRequest");
const AssignPickerRequest = z
    .object({
    assignedToId: z.string().min(1),
})
    .openapi("AssignPickerRequest");
const PickItemUnitRequest = z
    .object({
    pickingTaskItemId: z.string().min(1),
    locationStockId: z.string().min(1),
    quantity: z.number().gt(0),
})
    .openapi("PickItemUnitRequest");
const PickItemsRequest = z
    .object({
    items: z.array(PickItemUnitRequest).min(1),
})
    .openapi("PickItemsRequest");
// ─── Query schemas ───────────────────────────────────────────────────
const PickingListQuery = z
    .object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    searchTerm: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
    status: z.enum(["PENDING", "ASSIGNED", "IN_PROGRESS", "PARTIALLY_PICKED", "PICKED", "CANCELLED"]).optional(),
    warehouseId: z.string().optional(),
    assignedToId: z.string().optional(),
    salesOrderId: z.string().optional(),
})
    .openapi("PickingListQuery");
// ─── Register paths ──────────────────────────────────────────────────
export function registerPickingPaths(registry) {
    registry.registerComponent("schemas", "PickingTask", PickingTaskResponse);
    registry.registerComponent("schemas", "PickingTaskItem", PickingTaskItemResponse);
    registry.registerComponent("schemas", "PickingTaskDetail", PickingTaskDetailResponse);
    registry.registerComponent("schemas", "PickingTaskItemDetail", PickingTaskItemDetailResponse);
    registry.registerComponent("schemas", "PickingAllocation", PickingAllocationResponse);
    registry.registerComponent("schemas", "CreatePickingTaskRequest", CreatePickingTaskRequest);
    registry.registerComponent("schemas", "AssignPickerRequest", AssignPickerRequest);
    registry.registerComponent("schemas", "PickItemsRequest", PickItemsRequest);
    // ─── CREATE PICKING TASK ──────────────────────────────────────────
    // 1. POST /api/v1/picking
    registry.registerPath({
        method: "post",
        path: "/api/v1/picking",
        operationId: "createPickingTask",
        tags: ["Picking"],
        summary: "Create picking task",
        description: "Creates a picking task for a CONFIRMED Sales Order. Validates the Sales Order exists and is in CONFIRMED status. Prevents duplicate picking tasks per Sales Order (1:1 relationship). Requires at least one active StockReservation. Generates a unique picking number (e.g. PICK-2026-000001). Creates PickingTaskItems from SalesOrderItems with requiredQuantity derived from active reservations. Status is set to PENDING. Sends notification to Warehouse Manager(s). Requires SUPER_ADMIN, ADMIN, or WAREHOUSE_MANAGER role.",
        security: [{ cookieAuth: [] }],
        request: {
            body: { content: { "application/json": { schema: CreatePickingTaskRequest } } },
        },
        responses: {
            201: {
                description: "Picking task created successfully",
                content: { "application/json": { schema: SuccessResponse(PickingTaskResponse) } },
            },
            400: { description: "Validation error, Sales Order not CONFIRMED, duplicate task, or no active reservations", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — requires SUPER_ADMIN, ADMIN, or WAREHOUSE_MANAGER role", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Sales Order not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── LIST PICKING TASKS ───────────────────────────────────────────
    // 2. GET /api/v1/picking
    registry.registerPath({
        method: "get",
        path: "/api/v1/picking",
        operationId: "listPickingTasks",
        tags: ["Picking"],
        summary: "List picking tasks",
        description: "Retrieves a paginated list of picking tasks with warehouse, salesOrder, assignedTo (user), and items (with product) included. Warehouse-scoped users (non-SUPER_ADMIN/ADMIN) see only tasks for their assigned warehouse. STAFF users can only see tasks assigned to themselves within their warehouse. Supports search by pickingNumber. Filterable by status, warehouseId, assignedToId, and salesOrderId.",
        security: [{ cookieAuth: [] }],
        request: { query: PickingListQuery },
        responses: {
            200: {
                description: "Picking tasks fetched successfully",
                content: { "application/json": { schema: PaginatedResponse(PickingTaskResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── GET PICKING TASK BY SALES ORDER ───────────────────────────────
    // 3. GET /api/v1/picking/sales-order/:salesOrderId
    registry.registerPath({
        method: "get",
        path: "/api/v1/picking/sales-order/{salesOrderId}",
        operationId: "getPickingTaskBySalesOrder",
        tags: ["Picking"],
        summary: "Get picking task by Sales Order",
        description: "Retrieves the picking task associated with a specific Sales Order. Returns the full picking task detail including items with allocations, location hierarchy (zone/aisle/shelf/bin), and computed remainingQuantity per item. Warehouse access is validated via checkSoParamsWarehouseAccess.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ salesOrderId: z.string().describe("Sales Order ID") }),
        },
        responses: {
            200: {
                description: "Picking task retrieved for sales order successfully",
                content: { "application/json": { schema: SuccessResponse(PickingTaskDetailResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Picking task not found for the specified Sales Order", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── GET PICKING TASK BY ID ────────────────────────────────────────
    // 4. GET /api/v1/picking/:id
    registry.registerPath({
        method: "get",
        path: "/api/v1/picking/{id}",
        operationId: "getPickingTaskById",
        tags: ["Picking"],
        summary: "Get picking task by ID",
        description: "Retrieves a single picking task with full details: warehouse, salesOrder, assignedTo, and items (with product, allocations, location hierarchy, and computed remainingQuantity). Allocations include the full zone/aisle/shelf/bin location chain. Warehouse access is validated via checkPickingWarehouseAccess.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Picking Task ID") }),
        },
        responses: {
            200: {
                description: "Picking task details retrieved successfully",
                content: { "application/json": { schema: SuccessResponse(PickingTaskDetailResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Picking task not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── ASSIGN PICKER ────────────────────────────────────────────────
    // 5. PATCH /api/v1/picking/:id/assign
    registry.registerPath({
        method: "patch",
        path: "/api/v1/picking/{id}/assign",
        operationId: "assignPickingTask",
        tags: ["Picking"],
        summary: "Assign picker to picking task",
        description: "Assigns a STAFF user as the picker for a picking task. Validates the target user exists, is ACTIVE, has STAFF role, and belongs to the same warehouse as the picking task. Task cannot be CANCELLED or PICKED. Transitions status to ASSIGNED. Sends notification to the assigned picker. Requires SUPER_ADMIN, ADMIN, or WAREHOUSE_MANAGER role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Picking Task ID") }),
            body: { content: { "application/json": { schema: AssignPickerRequest } } },
        },
        responses: {
            200: {
                description: "Picker assigned successfully",
                content: { "application/json": { schema: SuccessResponse(PickingTaskResponse) } },
            },
            400: { description: "Task already cancelled/completed, user not STAFF, inactive user, or warehouse mismatch", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access or insufficient role", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Picking task or target user not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── START PICKING ────────────────────────────────────────────────
    // 6. PATCH /api/v1/picking/:id/start
    registry.registerPath({
        method: "patch",
        path: "/api/v1/picking/{id}/start",
        operationId: "startPickingTask",
        tags: ["Picking"],
        summary: "Start picking",
        description: "Transitions a picking task to IN_PROGRESS. Task must not be CANCELLED or PICKED. STAFF users can only start tasks assigned to themselves (ownership restriction). SUPER_ADMIN and ADMIN can start any accessible task. Sends notification to the assigned picker. Requires SUPER_ADMIN, ADMIN, or STAFF role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Picking Task ID") }),
        },
        responses: {
            200: {
                description: "Picking started successfully",
                content: { "application/json": { schema: SuccessResponse(PickingTaskResponse) } },
            },
            400: { description: "Task already cancelled or completed", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — STAFF can only start own assigned task, or no warehouse access", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Picking task not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── PICK ITEMS FROM BIN ──────────────────────────────────────────
    // 7. POST /api/v1/picking/:id/pick
    registry.registerPath({
        method: "post",
        path: "/api/v1/picking/{id}/pick",
        operationId: "pickItems",
        tags: ["Picking"],
        summary: "Pick items from bin",
        description: "Picks stock items from inventory bins for a picking task. Accepts an array of items, each specifying a pickingTaskItemId, locationStockId (inventory bin), and quantity. Pre-validates outside transaction for fast-fail. Inside an atomic transaction: acquires FOR UPDATE row locks on picking_tasks and inventory_stocks in deterministic product-ID order, locks inventory_location_stocks, validates product match, warehouse match, and sufficient bin stock. For each item: decrements InventoryLocationStock, updates PickingTaskItem pickedQuantity/status, creates a PickingAllocation record, creates a StockMovement OUT record, decrements aggregate InventoryStock. When a PickingTaskItem reaches PICKED status, its active StockReservations are set to CONSUMED. When the overall task reaches PICKED status, all remaining active reservations for the Sales Order are consumed. STAFF can only pick items for tasks assigned to themselves. Requires SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER, or STAFF role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Picking Task ID") }),
            body: { content: { "application/json": { schema: PickItemsRequest } } },
        },
        responses: {
            200: {
                description: "Stock items picked successfully",
                content: { "application/json": { schema: SuccessResponse(PickingTaskResponse) } },
            },
            400: { description: "Task cancelled/completed, product mismatch, warehouse mismatch, insufficient bin stock, or quantity exceeds remaining required", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — STAFF can only pick for own assigned task, or no warehouse access", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Picking task, picking task item, or location stock not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
}
