import { z } from "zod";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { PaginatedResponse, SuccessResponse, ErrorResponse } from "../components/responses";
import { WarehouseResponse, UserResponse } from "../components/schemas";

// Re-export the existing WarehouseListItem for the list endpoint
const WarehouseListItem = z
    .object({
        id: z.string(),
        code: z.string(),
        name: z.string(),
        description: z.string().nullable().optional(),
        address: z.string().nullable().optional(),
        city: z.string().nullable().optional(),
        country: z.string().nullable().optional(),
        status: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .openapi("WarehouseListItem");

const ListWarehousesQuery = z
    .object({
        page: z.coerce.number().int().min(1).default(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
        searchTerm: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
        status: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        fields: z.string().optional(),
    })
    .openapi("ListWarehousesQuery");

const CreateWarehouseRequest = z
    .object({
        code: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
    })
    .openapi("CreateWarehouseRequest");

const UpdateWarehouseRequest = z
    .object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    })
    .openapi("UpdateWarehouseRequest");

const UpdateWarehouseStatusRequest = z
    .object({
        status: z.enum(["ACTIVE", "INACTIVE"]),
    })
    .openapi("UpdateWarehouseStatusRequest");

export function registerWarehouseModulePaths(registry: OpenAPIRegistry) {
    registry.registerComponent("schemas", "WarehouseListItem", WarehouseListItem as never);
    registry.registerComponent("schemas", "CreateWarehouseRequest", CreateWarehouseRequest as never);
    registry.registerComponent("schemas", "UpdateWarehouseRequest", UpdateWarehouseRequest as never);
    registry.registerComponent("schemas", "UpdateWarehouseStatusRequest", UpdateWarehouseStatusRequest as never);

    // POST /api/v1/warehouses/
    registry.registerPath({
        method: "post",
        path: "/api/v1/warehouses",
        operationId: "createWarehouse",
        tags: ["Warehouses"],
        summary: "Create warehouse",
        description: "Creates a new warehouse. Code must be unique. Requires SUPER_ADMIN or ADMIN role.",
        security: [{ cookieAuth: [] }],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: CreateWarehouseRequest,
                    },
                },
            },
        },
        responses: {
            201: {
                description: "Warehouse created successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(WarehouseResponse),
                    },
                },
            },
            400: {
                description: "Validation error or duplicate code",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            401: {
                description: "Unauthorized",
                content: { "application/json": { schema: ErrorResponse } },
            },
            403: {
                description: "Forbidden",
                content: { "application/json": { schema: ErrorResponse } },
            },
        },
    });

    // GET /api/v1/warehouses/
    registry.registerPath({
        method: "get",
        path: "/api/v1/warehouses",
        operationId: "listWarehouses",
        tags: ["Warehouses"],
        summary: "List all warehouses",
        description:
            "Retrieves a paginated list of warehouses. All authenticated roles permitted.",
        security: [{ cookieAuth: [] }],
        request: { query: ListWarehousesQuery },
        responses: {
            200: {
                description: "Warehouses retrieved successfully",
                content: {
                    "application/json": {
                        schema: PaginatedResponse(WarehouseListItem),
                    },
                },
            },
            401: {
                description: "Unauthorized",
                content: { "application/json": { schema: ErrorResponse } },
            },
        },
    });

    // GET /api/v1/warehouses/:warehouseId/users
    registry.registerPath({
        method: "get",
        path: "/api/v1/warehouses/{warehouseId}/users",
        operationId: "getWarehouseUsers",
        tags: ["Warehouses"],
        summary: "Get warehouse users",
        description: "Retrieves a paginated list of users assigned to a specific warehouse.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ warehouseId: z.string().describe("Warehouse ID") }),
            query: ListWarehousesQuery,
        },
        responses: {
            200: {
                description: "Warehouse users fetched successfully",
                content: {
                    "application/json": {
                        schema: PaginatedResponse(UserResponse),
                    },
                },
            },
            401: {
                description: "Unauthorized",
                content: { "application/json": { schema: ErrorResponse } },
            },
            404: {
                description: "Warehouse not found",
                content: { "application/json": { schema: ErrorResponse } },
            },
        },
    });

    // GET /api/v1/warehouses/:warehouseId/structure
    registry.registerPath({
        method: "get",
        path: "/api/v1/warehouses/{warehouseId}/structure",
        operationId: "getWarehouseStructure",
        tags: ["Warehouses"],
        summary: "Get warehouse structure",
        description:
            "Retrieves the complete physical structure of a warehouse including nested zones, aisles, shelves, and bins.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ warehouseId: z.string().describe("Warehouse ID") }),
        },
        responses: {
            200: {
                description: "Warehouse structure retrieved successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(
                            z.object({
                                id: z.string(),
                                code: z.string(),
                                name: z.string(),
                                zones: z.array(
                                    z.object({
                                        id: z.string(),
                                        code: z.string(),
                                        name: z.string(),
                                        aisles: z.array(
                                            z.object({
                                                id: z.string(),
                                                code: z.string(),
                                                name: z.string(),
                                                shelves: z.array(
                                                    z.object({
                                                        id: z.string(),
                                                        code: z.string(),
                                                        name: z.string(),
                                                        bins: z.array(
                                                            z.object({
                                                                id: z.string(),
                                                                code: z.string(),
                                                                name: z.string(),
                                                            })
                                                        ),
                                                    })
                                                ),
                                            })
                                        ),
                                    })
                                ),
                            })
                        ),
                    },
                },
            },
            401: {
                description: "Unauthorized",
                content: { "application/json": { schema: ErrorResponse } },
            },
            404: {
                description: "Warehouse not found",
                content: { "application/json": { schema: ErrorResponse } },
            },
        },
    });

    // PATCH /api/v1/warehouses/:warehouseId/assign-user/:userId
    registry.registerPath({
        method: "patch",
        path: "/api/v1/warehouses/{warehouseId}/assign-user/{userId}",
        operationId: "assignWarehouseUser",
        tags: ["Warehouses"],
        summary: "Assign user to warehouse",
        description:
            "Assigns a user to a warehouse. User must be active and not already assigned. Warehouse must be active. Requires SUPER_ADMIN or ADMIN role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({
                warehouseId: z.string().describe("Warehouse ID"),
                userId: z.string().describe("User ID"),
            }),
        },
        responses: {
            200: {
                description: "User assigned to warehouse successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(UserResponse),
                    },
                },
            },
            400: {
                description: "User already assigned or warehouse inactive",
                content: { "application/json": { schema: ErrorResponse } },
            },
            401: {
                description: "Unauthorized",
                content: { "application/json": { schema: ErrorResponse } },
            },
            403: {
                description: "Forbidden",
                content: { "application/json": { schema: ErrorResponse } },
            },
            404: {
                description: "Warehouse or user not found",
                content: { "application/json": { schema: ErrorResponse } },
            },
        },
    });

    // PATCH /api/v1/warehouses/:warehouseId/unassign-user/:userId
    registry.registerPath({
        method: "patch",
        path: "/api/v1/warehouses/{warehouseId}/unassign-user/{userId}",
        operationId: "unassignWarehouseUser",
        tags: ["Warehouses"],
        summary: "Unassign user from warehouse",
        description: "Removes a user's warehouse assignment. Requires SUPER_ADMIN or ADMIN role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({
                warehouseId: z.string().describe("Warehouse ID"),
                userId: z.string().describe("User ID"),
            }),
        },
        responses: {
            200: {
                description: "User unassigned from warehouse successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(UserResponse),
                    },
                },
            },
            401: {
                description: "Unauthorized",
                content: { "application/json": { schema: ErrorResponse } },
            },
            403: {
                description: "Forbidden",
                content: { "application/json": { schema: ErrorResponse } },
            },
            404: {
                description: "Warehouse or user not found",
                content: { "application/json": { schema: ErrorResponse } },
            },
        },
    });

    // GET /api/v1/warehouses/:id
    registry.registerPath({
        method: "get",
        path: "/api/v1/warehouses/{id}",
        operationId: "getWarehouseById",
        tags: ["Warehouses"],
        summary: "Get warehouse by ID",
        description: "Retrieves a single warehouse by ID.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Warehouse ID") }),
        },
        responses: {
            200: {
                description: "Warehouse retrieved successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(WarehouseResponse),
                    },
                },
            },
            401: {
                description: "Unauthorized",
                content: { "application/json": { schema: ErrorResponse } },
            },
            404: {
                description: "Warehouse not found",
                content: { "application/json": { schema: ErrorResponse } },
            },
        },
    });

    // PATCH /api/v1/warehouses/:id
    registry.registerPath({
        method: "patch",
        path: "/api/v1/warehouses/{id}",
        operationId: "updateWarehouse",
        tags: ["Warehouses"],
        summary: "Update warehouse",
        description: "Updates warehouse details. Requires SUPER_ADMIN or ADMIN role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Warehouse ID") }),
            body: {
                content: {
                    "application/json": {
                        schema: UpdateWarehouseRequest,
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Warehouse updated successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(WarehouseResponse),
                    },
                },
            },
            400: {
                description: "Validation error",
                content: { "application/json": { schema: ErrorResponse } },
            },
            401: {
                description: "Unauthorized",
                content: { "application/json": { schema: ErrorResponse } },
            },
            403: {
                description: "Forbidden",
                content: { "application/json": { schema: ErrorResponse } },
            },
            404: {
                description: "Warehouse not found",
                content: { "application/json": { schema: ErrorResponse } },
            },
        },
    });

    // PATCH /api/v1/warehouses/:id/status
    registry.registerPath({
        method: "patch",
        path: "/api/v1/warehouses/{id}/status",
        operationId: "updateWarehouseStatus",
        tags: ["Warehouses"],
        summary: "Update warehouse status",
        description: "Updates the status of a warehouse. Requires SUPER_ADMIN or ADMIN role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Warehouse ID") }),
            body: {
                content: {
                    "application/json": {
                        schema: UpdateWarehouseStatusRequest,
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Warehouse status updated successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(WarehouseResponse),
                    },
                },
            },
            400: {
                description: "Validation error",
                content: { "application/json": { schema: ErrorResponse } },
            },
            401: {
                description: "Unauthorized",
                content: { "application/json": { schema: ErrorResponse } },
            },
            403: {
                description: "Forbidden",
                content: { "application/json": { schema: ErrorResponse } },
            },
            404: {
                description: "Warehouse not found",
                content: { "application/json": { schema: ErrorResponse } },
            },
        },
    });
}
