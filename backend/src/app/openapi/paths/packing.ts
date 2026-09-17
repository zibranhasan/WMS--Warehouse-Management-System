import { z } from "zod";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { PaginatedResponse, SuccessResponse, ErrorResponse } from "../components/responses.js";
import { WarehouseResponse, ProductResponse, SalesOrderSummary } from "../components/schemas.js";

// ─── Response sub-schemas ─────────────────────────────────────────────

const PackingUserRef = z
    .object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        role: z.string(),
    })
    .openapi("PackingUserRef");

const PackageItemResponse = z
    .object({
        id: z.string(),
        packageId: z.string(),
        packingTaskItemId: z.string(),
        productId: z.string(),
        quantity: z.number(),
        createdAt: z.string(),
        updatedAt: z.string(),
        product: ProductResponse.optional(),
    })
    .openapi("PackageItem");

const PackageResponse = z
    .object({
        id: z.string(),
        packingTaskId: z.string(),
        packageNumber: z.string(),
        status: z.enum(["OPEN", "PACKED", "CANCELLED"]),
        weight: z.number().nullable().optional(),
        notes: z.string().nullable().optional(),
        createdAt: z.string(),
        updatedAt: z.string(),
        items: z.array(PackageItemResponse).optional(),
    })
    .openapi("Package");

const PackingTaskItemResponse = z
    .object({
        id: z.string(),
        packingTaskId: z.string(),
        salesOrderItemId: z.string(),
        productId: z.string(),
        requiredQuantity: z.number(),
        packedQuantity: z.number(),
        status: z.enum(["PENDING", "PARTIALLY_PACKED", "PACKED"]),
        createdAt: z.string(),
        updatedAt: z.string(),
        product: ProductResponse.optional(),
    })
    .openapi("PackingTaskItem");

const PackingTaskResponse = z
    .object({
        id: z.string(),
        packingNumber: z.string(),
        salesOrderId: z.string(),
        warehouseId: z.string(),
        packedById: z.string().nullable().optional(),
        status: z.enum(["PENDING", "IN_PROGRESS", "PARTIALLY_PACKED", "PACKED", "CANCELLED"]),
        createdAt: z.string(),
        updatedAt: z.string(),
        warehouse: WarehouseResponse.optional(),
        salesOrder: SalesOrderSummary.optional(),
        packedBy: PackingUserRef.nullable().optional(),
        items: z.array(PackingTaskItemResponse).optional(),
        packages: z.array(PackageResponse).optional(),
    })
    .openapi("PackingTask");

const PackingTaskItemDetailResponse = z
    .object({
        id: z.string(),
        packingTaskId: z.string(),
        salesOrderItemId: z.string(),
        productId: z.string(),
        requiredQuantity: z.number(),
        packedQuantity: z.number(),
        remainingQuantity: z.number(),
        status: z.enum(["PENDING", "PARTIALLY_PACKED", "PACKED"]),
        createdAt: z.string(),
        updatedAt: z.string(),
        product: ProductResponse.optional(),
    })
    .openapi("PackingTaskItemDetail");

const PackingTaskDetailResponse = z
    .object({
        id: z.string(),
        packingNumber: z.string(),
        salesOrderId: z.string(),
        warehouseId: z.string(),
        packedById: z.string().nullable().optional(),
        status: z.enum(["PENDING", "IN_PROGRESS", "PARTIALLY_PACKED", "PACKED", "CANCELLED"]),
        createdAt: z.string(),
        updatedAt: z.string(),
        warehouse: WarehouseResponse.optional(),
        salesOrder: SalesOrderSummary.optional(),
        packedBy: PackingUserRef.nullable().optional(),
        items: z.array(PackingTaskItemDetailResponse).optional(),
        packages: z.array(PackageResponse).optional(),
    })
    .openapi("PackingTaskDetail");

// ─── Request schemas ─────────────────────────────────────────────────

const CreatePackingTaskRequest = z
    .object({
        salesOrderId: z.string().min(1),
    })
    .openapi("CreatePackingTaskRequest");

const AssignPackerRequest = z
    .object({
        assignedToId: z.string().min(1),
    })
    .openapi("AssignPackerRequest");

const CreatePackageRequest = z
    .object({
        weight: z.number().positive().optional(),
        notes: z.string().optional(),
    })
    .openapi("CreatePackageRequest");

const AddPackageItemUnitRequest = z
    .object({
        packingTaskItemId: z.string().min(1),
        quantity: z.number().gt(0),
    })
    .openapi("AddPackageItemUnitRequest");

const AddPackageItemsRequest = z
    .object({
        items: z.array(AddPackageItemUnitRequest).min(1),
    })
    .openapi("AddPackageItemsRequest");

const CancelPackingTaskRequest = z
    .object({
        cancellationReason: z.string().min(1),
    })
    .openapi("CancelPackingTaskRequest");

// ─── Query schemas ───────────────────────────────────────────────────

const PackingListQuery = z
    .object({
        page: z.coerce.number().int().min(1).default(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
        searchTerm: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
        status: z.enum(["PENDING", "IN_PROGRESS", "PARTIALLY_PACKED", "PACKED", "CANCELLED"]).optional(),
        warehouseId: z.string().optional(),
        salesOrderId: z.string().optional(),
        packedById: z.string().optional(),
    })
    .openapi("PackingListQuery");

// ─── Register paths ──────────────────────────────────────────────────

export function registerPackingPaths(registry: OpenAPIRegistry) {
    registry.registerComponent("schemas", "PackingTask", PackingTaskResponse as never);
    registry.registerComponent("schemas", "PackingTaskItem", PackingTaskItemResponse as never);
    registry.registerComponent("schemas", "PackingTaskDetail", PackingTaskDetailResponse as never);
    registry.registerComponent("schemas", "PackingTaskItemDetail", PackingTaskItemDetailResponse as never);
    registry.registerComponent("schemas", "Package", PackageResponse as never);
    registry.registerComponent("schemas", "PackageItem", PackageItemResponse as never);
    registry.registerComponent("schemas", "CreatePackingTaskRequest", CreatePackingTaskRequest as never);
    registry.registerComponent("schemas", "AssignPackerRequest", AssignPackerRequest as never);
    registry.registerComponent("schemas", "CreatePackageRequest", CreatePackageRequest as never);
    registry.registerComponent("schemas", "AddPackageItemsRequest", AddPackageItemsRequest as never);
    registry.registerComponent("schemas", "CancelPackingTaskRequest", CancelPackingTaskRequest as never);

    // ─── CREATE PACKING TASK ──────────────────────────────────────────

    // 1. POST /api/v1/packing
    registry.registerPath({
        method: "post",
        path: "/api/v1/packing",
        operationId: "createPackingTask",
        tags: ["Packing"],
        summary: "Create packing task",
        description:
            "Creates a packing task for a Sales Order. Validates the Sales Order exists, is not CANCELLED, has an associated PickingTask with status PICKED, and all picking items are fully picked. Prevents duplicate packing tasks per Sales Order (1:1 relationship). Generates a unique packing number (e.g. PACK-2026-000001). Creates PackingTaskItems from PickingTaskItems with requiredQuantity set to the pickedQuantity. Status is set to PENDING. Sends notification to Warehouse Manager(s). Requires SUPER_ADMIN, ADMIN, or WAREHOUSE_MANAGER role.",
        security: [{ cookieAuth: [] }],
        request: {
            body: { content: { "application/json": { schema: CreatePackingTaskRequest } } },
        },
        responses: {
            201: {
                description: "Packing task created successfully",
                content: { "application/json": { schema: SuccessResponse(PackingTaskDetailResponse) } },
            },
            400: { description: "Validation error, Sales Order cancelled, no picking task, picking not complete, or duplicate packing task", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — requires SUPER_ADMIN, ADMIN, or WAREHOUSE_MANAGER role", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Sales Order not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── LIST PACKING TASKS ───────────────────────────────────────────

    // 2. GET /api/v1/packing
    registry.registerPath({
        method: "get",
        path: "/api/v1/packing",
        operationId: "listPackingTasks",
        tags: ["Packing"],
        summary: "List packing tasks",
        description:
            "Retrieves a paginated list of packing tasks with warehouse, salesOrder, packedBy (user), items (with product), and packages (with items/products) included. Warehouse-scoped users (non-SUPER_ADMIN/ADMIN) see only tasks for their assigned warehouse. Supports search by packingNumber. Filterable by status, warehouseId, salesOrderId, and packedById.",
        security: [{ cookieAuth: [] }],
        request: { query: PackingListQuery },
        responses: {
            200: {
                description: "Packing tasks fetched successfully",
                content: { "application/json": { schema: PaginatedResponse(PackingTaskResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── GET PACKING TASK BY SALES ORDER ───────────────────────────────

    // 3. GET /api/v1/packing/sales-order/:salesOrderId
    registry.registerPath({
        method: "get",
        path: "/api/v1/packing/sales-order/{salesOrderId}",
        operationId: "getPackingTaskBySalesOrder",
        tags: ["Packing"],
        summary: "Get packing task by Sales Order",
        description:
            "Retrieves the packing task associated with a specific Sales Order. Returns the full packing task detail including items with remainingQuantity, packages with items, warehouse, salesOrder, and packedBy. Warehouse access is validated via checkSoParamsWarehouseAccess.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ salesOrderId: z.string().describe("Sales Order ID") }),
        },
        responses: {
            200: {
                description: "Packing task retrieved for sales order successfully",
                content: { "application/json": { schema: SuccessResponse(PackingTaskDetailResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Packing task not found for the specified Sales Order", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── GET PACKING TASK BY ID ────────────────────────────────────────

    // 4. GET /api/v1/packing/:id
    registry.registerPath({
        method: "get",
        path: "/api/v1/packing/{id}",
        operationId: "getPackingTaskById",
        tags: ["Packing"],
        summary: "Get packing task by ID",
        description:
            "Retrieves a single packing task with full details: warehouse, salesOrder, packedBy, items (with product, remainingQuantity), and packages (with items/products). Warehouse access is validated via checkPackingWarehouseAccess.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Packing Task ID") }),
        },
        responses: {
            200: {
                description: "Packing task details retrieved successfully",
                content: { "application/json": { schema: SuccessResponse(PackingTaskDetailResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Packing task not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── ASSIGN PACKER ────────────────────────────────────────────────

    // 5. PATCH /api/v1/packing/:id/assign
    registry.registerPath({
        method: "patch",
        path: "/api/v1/packing/{id}/assign",
        operationId: "assignPackingTask",
        tags: ["Packing"],
        summary: "Assign packer to packing task",
        description:
            "Assigns a STAFF user as the packer for a packing task. Validates the target user exists, is ACTIVE, has STAFF role, and belongs to the same warehouse as the packing task. Task cannot be CANCELLED or PACKED. Updates packedById. Sends notification to the assigned packer. Requires SUPER_ADMIN, ADMIN, or WAREHOUSE_MANAGER role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Packing Task ID") }),
            body: { content: { "application/json": { schema: AssignPackerRequest } } },
        },
        responses: {
            200: {
                description: "Packer assigned successfully",
                content: { "application/json": { schema: SuccessResponse(PackingTaskResponse) } },
            },
            400: { description: "Task already cancelled/completed, user not STAFF, inactive user, or warehouse mismatch", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access or insufficient role", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Packing task or target user not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── START PACKING ────────────────────────────────────────────────

    // 6. PATCH /api/v1/packing/:id/start
    registry.registerPath({
        method: "patch",
        path: "/api/v1/packing/{id}/start",
        operationId: "startPackingTask",
        tags: ["Packing"],
        summary: "Start packing",
        description:
            "Transitions a packing task from PENDING to IN_PROGRESS. Task must be in PENDING status. STAFF users can only start tasks assigned to themselves (packedById === userId). SUPER_ADMIN and ADMIN can start any accessible task. Sends notification to the assigned packer. Requires SUPER_ADMIN, ADMIN, or STAFF role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Packing Task ID") }),
        },
        responses: {
            200: {
                description: "Packing task started successfully",
                content: { "application/json": { schema: SuccessResponse(PackingTaskResponse) } },
            },
            400: { description: "Task not in PENDING status", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — STAFF can only start own assigned task, or no warehouse access", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Packing task not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── CREATE PACKAGE ───────────────────────────────────────────────

    // 7. POST /api/v1/packing/:id/packages
    registry.registerPath({
        method: "post",
        path: "/api/v1/packing/{id}/packages",
        operationId: "createPackage",
        tags: ["Packing"],
        summary: "Create package for packing task",
        description:
            "Creates a new package (OPEN status) for a packing task. Task cannot be CANCELLED or PACKED. Generates a unique package number (e.g. PKG-2026-000001). Accepts optional weight and notes. STAFF can only create packages for tasks assigned to themselves. Requires SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER, or STAFF role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Packing Task ID") }),
            body: { content: { "application/json": { schema: CreatePackageRequest } } },
        },
        responses: {
            201: {
                description: "Package created successfully",
                content: { "application/json": { schema: SuccessResponse(PackageResponse) } },
            },
            400: { description: "Task cancelled/completed", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — STAFF can only create for own assigned task, or no warehouse access", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Packing task not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── GET PACKAGES ─────────────────────────────────────────────────

    // 8. GET /api/v1/packing/:id/packages
    registry.registerPath({
        method: "get",
        path: "/api/v1/packing/{id}/packages",
        operationId: "getPackages",
        tags: ["Packing"],
        summary: "Get packages for packing task",
        description:
            "Retrieves all packages for a packing task, ordered by createdAt ascending. Each package includes its items with product details. Warehouse access is validated via checkPackingWarehouseAccess.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Packing Task ID") }),
        },
        responses: {
            200: {
                description: "Packages retrieved successfully",
                content: { "application/json": { schema: SuccessResponse(z.array(PackageResponse)) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Packing task not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── ADD ITEMS TO PACKAGE ─────────────────────────────────────────

    // 9. POST /api/v1/packing/:id/packages/:packageId/items
    registry.registerPath({
        method: "post",
        path: "/api/v1/packing/{id}/packages/{packageId}/items",
        operationId: "addPackageItems",
        tags: ["Packing"],
        summary: "Add items to package",
        description:
            "Adds items to a package in an atomic transaction with FOR UPDATE row locks on packing_task_items to prevent concurrent over-packing. Items are processed in deterministic order (sorted by packingTaskItemId). Validates: package must be OPEN, task must not be CANCELLED/PACKED, each packingTaskItem must belong to the task, and requested quantity cannot exceed remaining required quantity (requiredQuantity - packedQuantity). Creates PackageItems, updates PackingTaskItem packedQuantity and status (PARTIALLY_PACKED/PACKED), and recalculates overall PackingTask status (IN_PROGRESS → PARTIALLY_PACKED → PACKED). When the task becomes PACKED, notifies the SalesOrder creator. STAFF can only add items for tasks assigned to themselves. Requires SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER, or STAFF role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({
                id: z.string().describe("Packing Task ID"),
                packageId: z.string().describe("Package ID"),
            }),
            body: { content: { "application/json": { schema: AddPackageItemsRequest } } },
        },
        responses: {
            200: {
                description: "Items added to package successfully",
                content: { "application/json": { schema: SuccessResponse(PackingTaskResponse) } },
            },
            400: { description: "Task cancelled/completed, package closed, item not in task, or quantity exceeds remaining", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — STAFF can only add to own assigned task, or no warehouse access", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Packing task, package, or packing task item not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── CLOSE PACKAGE ────────────────────────────────────────────────

    // 10. PATCH /api/v1/packing/:id/packages/:packageId/close
    registry.registerPath({
        method: "patch",
        path: "/api/v1/packing/{id}/packages/{packageId}/close",
        operationId: "closePackage",
        tags: ["Packing"],
        summary: "Close package",
        description:
            "Closes a package by setting its status to PACKED. Package must be OPEN, non-empty (at least one item), and the packing task must not be CANCELLED or PACKED. Does not change the overall packing task status (task status is recalculated when items are added). STAFF can only close packages for tasks assigned to themselves. Requires SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER, or STAFF role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({
                id: z.string().describe("Packing Task ID"),
                packageId: z.string().describe("Package ID"),
            }),
        },
        responses: {
            200: {
                description: "Package closed successfully",
                content: { "application/json": { schema: SuccessResponse(PackageResponse) } },
            },
            400: { description: "Package already closed, empty, or task cancelled/completed", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — STAFF can only close for own assigned task, or no warehouse access", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Packing task or package not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── CANCEL PACKING TASK ──────────────────────────────────────────

    // 11. PATCH /api/v1/packing/:id/cancel
    registry.registerPath({
        method: "patch",
        path: "/api/v1/packing/{id}/cancel",
        operationId: "cancelPackingTask",
        tags: ["Packing"],
        summary: "Cancel packing task",
        description:
            "Cancels a packing task by setting its status to CANCELLED. Task cannot be already PACKED or CANCELLED. Requires a cancellation reason. Sends notification to the SalesOrder creator with the cancellation reason. Requires SUPER_ADMIN, ADMIN, or WAREHOUSE_MANAGER role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Packing Task ID") }),
            body: { content: { "application/json": { schema: CancelPackingTaskRequest } } },
        },
        responses: {
            200: {
                description: "Packing task cancelled successfully",
                content: { "application/json": { schema: SuccessResponse(PackingTaskResponse) } },
            },
            400: { description: "Task already cancelled or completed", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access or insufficient role", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Packing task not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
}
