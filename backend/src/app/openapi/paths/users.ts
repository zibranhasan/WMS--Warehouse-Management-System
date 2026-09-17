import { z } from "zod";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { PaginatedResponse, SuccessResponse, ErrorResponse } from "../components/responses.js";
import { UserResponse } from "../components/schemas.js";

const ListUsersQuery = z
    .object({
        page: z.coerce.number().int().min(1).default(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
        searchTerm: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
        role: z.string().optional(),
        status: z.string().optional(),
        warehouseId: z.string().optional(),
        fields: z.string().optional(),
    })
    .openapi("ListUsersQuery");

const AssignRoleRequest = z
    .object({
        role: z.enum(["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER", "PROCUREMENT", "STAFF", "FINANCE"]),
    })
    .openapi("AssignRoleRequest");

const AssignWarehouseRequest = z
    .object({
        warehouseId: z.string(),
    })
    .openapi("AssignWarehouseRequest");

const AssignWarehouseResponseData = UserResponse.extend({
    warehouseId: z.string().describe("Assigned warehouse ID"),
    message: z.string().describe("Status message"),
}).openapi("AssignWarehouseResponseData");

export function registerUserPaths(registry: OpenAPIRegistry) {
    registry.registerComponent("schemas", "AssignRoleRequest", AssignRoleRequest as never);
    registry.registerComponent("schemas", "AssignWarehouseRequest", AssignWarehouseRequest as never);

    // POST /api/v1/users/
    registry.registerPath({
        method: "post",
        path: "/api/v1/users",
        operationId: "createUser",
        tags: ["Users"],
        summary: "Create employee user",
        description:
            "Creates a new employee user account. A temporary password is generated and sent via email. Requires SUPER_ADMIN or ADMIN role.",
        security: [{ cookieAuth: [] }],
        request: {
            body: {
                content: {
                    "multipart/form-data": {
                        schema: {
                            type: "object",
                            required: ["name", "email", "role"],
                            properties: {
                                name: { type: "string", minLength: 2, description: "Employee name" },
                                email: { type: "string", format: "email", description: "Employee email" },
                                role: {
                                    type: "string",
                                    enum: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER", "PROCUREMENT", "STAFF", "FINANCE"],
                                    description: "User role",
                                },
                                image: { type: "string", format: "binary", description: "Profile image (optional)" },
                            },
                        },
                    },
                },
            },
        },
        responses: {
            201: {
                description: "Employee created successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(UserResponse),
                    },
                },
            },
            400: {
                description: "Validation error",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            401: {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            403: {
                description: "Forbidden — requires SUPER_ADMIN or ADMIN role",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
        },
    });

    // GET /api/v1/users/
    registry.registerPath({
        method: "get",
        path: "/api/v1/users",
        operationId: "listUsers",
        tags: ["Users"],
        summary: "List all users",
        description:
            "Retrieves a paginated list of users. Requires SUPER_ADMIN, ADMIN, or WAREHOUSE_MANAGER role.",
        security: [{ cookieAuth: [] }],
        request: {
            query: ListUsersQuery,
        },
        responses: {
            200: {
                description: "Users retrieved successfully",
                content: {
                    "application/json": {
                        schema: PaginatedResponse(UserResponse),
                    },
                },
            },
            401: {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            403: {
                description: "Forbidden",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
        },
    });

    // PATCH /api/v1/users/:id/block
    registry.registerPath({
        method: "patch",
        path: "/api/v1/users/{id}/block",
        operationId: "blockUser",
        tags: ["Users"],
        summary: "Block a user",
        description:
            "Blocks a user account. Cannot block your own account. Requires SUPER_ADMIN or ADMIN role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({
                id: z.string().describe("User ID"),
            }),
        },
        responses: {
            200: {
                description: "User blocked successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(UserResponse),
                    },
                },
            },
            400: {
                description: "Cannot block yourself",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            401: {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            403: {
                description: "Forbidden",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            404: {
                description: "User not found",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
        },
    });

    // PATCH /api/v1/users/:id/unblock
    registry.registerPath({
        method: "patch",
        path: "/api/v1/users/{id}/unblock",
        operationId: "unblockUser",
        tags: ["Users"],
        summary: "Unblock a user",
        description: "Unblocks a previously blocked user account. Requires SUPER_ADMIN or ADMIN role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({
                id: z.string().describe("User ID"),
            }),
        },
        responses: {
            200: {
                description: "User unblocked successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(UserResponse),
                    },
                },
            },
            401: {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            403: {
                description: "Forbidden",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            404: {
                description: "User not found",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
        },
    });

    // PATCH /api/v1/users/:id/role
    registry.registerPath({
        method: "patch",
        path: "/api/v1/users/{id}/role",
        operationId: "assignUserRole",
        tags: ["Users"],
        summary: "Assign role to user",
        description: "Assigns a new role to a user. Requires SUPER_ADMIN or ADMIN role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({
                id: z.string().describe("User ID"),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: AssignRoleRequest,
                    },
                },
            },
        },
        responses: {
            200: {
                description: "User role assigned successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(UserResponse),
                    },
                },
            },
            400: {
                description: "Validation error",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            401: {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            403: {
                description: "Forbidden",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            404: {
                description: "User not found",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
        },
    });

    // PATCH /api/v1/users/:id/warehouse
    registry.registerPath({
        method: "patch",
        path: "/api/v1/users/{id}/warehouse",
        operationId: "assignUserWarehouse",
        tags: ["Users"],
        summary: "Assign warehouse to user",
        description: "Assigns a warehouse to a user. Requires SUPER_ADMIN or ADMIN role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({
                id: z.string().describe("User ID"),
            }),
            body: {
                content: {
                    "application/json": {
                        schema: AssignWarehouseRequest,
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Warehouse assigned successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(AssignWarehouseResponseData),
                    },
                },
            },
            400: {
                description: "Validation error",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            401: {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            403: {
                description: "Forbidden",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
        },
    });

    // GET /api/v1/users/:id
    registry.registerPath({
        method: "get",
        path: "/api/v1/users/{id}",
        operationId: "getUserById",
        tags: ["Users"],
        summary: "Get user by ID",
        description: "Retrieves a single user by ID. Requires SUPER_ADMIN or ADMIN role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({
                id: z.string().describe("User ID"),
            }),
        },
        responses: {
            200: {
                description: "User retrieved successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(UserResponse),
                    },
                },
            },
            401: {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            403: {
                description: "Forbidden",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            404: {
                description: "User not found",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
        },
    });

    // PATCH /api/v1/users/:id
    registry.registerPath({
        method: "patch",
        path: "/api/v1/users/{id}",
        operationId: "updateUser",
        tags: ["Users"],
        summary: "Update user",
        description:
            "Updates a user's details. Accepts multipart/form-data with optional image. Requires SUPER_ADMIN or ADMIN role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({
                id: z.string().describe("User ID"),
            }),
            body: {
                content: {
                    "multipart/form-data": {
                        schema: {
                            type: "object",
                            properties: {
                                name: { type: "string", minLength: 2, description: "User name" },
                                role: {
                                    type: "string",
                                    enum: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER", "PROCUREMENT", "STAFF", "FINANCE"],
                                    description: "User role",
                                },
                                status: {
                                    type: "string",
                                    enum: ["ACTIVE", "BLOCKED", "DELETED"],
                                    description: "User status",
                                },
                                image: { type: "string", format: "binary", description: "Profile image (optional)" },
                            },
                        },
                    },
                },
            },
        },
        responses: {
            200: {
                description: "User updated successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(UserResponse),
                    },
                },
            },
            400: {
                description: "Validation error",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            401: {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            403: {
                description: "Forbidden",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            404: {
                description: "User not found",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
        },
    });

    // DELETE /api/v1/users/:id
    registry.registerPath({
        method: "delete",
        path: "/api/v1/users/{id}",
        operationId: "deleteUser",
        tags: ["Users"],
        summary: "Delete user",
        description:
            "Soft-deletes a user (sets isDeleted, deletedAt, and status=DELETED). Cannot delete your own account. Requires SUPER_ADMIN or ADMIN role.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({
                id: z.string().describe("User ID"),
            }),
        },
        responses: {
            200: {
                description: "User deleted successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(UserResponse),
                    },
                },
            },
            400: {
                description: "Cannot delete yourself",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            401: {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            403: {
                description: "Forbidden",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            404: {
                description: "User not found",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
        },
    });
}
