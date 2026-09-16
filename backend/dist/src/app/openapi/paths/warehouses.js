import { z } from "zod";
import { PaginatedResponse, ErrorResponse } from "../components/responses";
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
})
    .openapi("ListWarehousesQuery");
export function registerWarehousePaths(registry) {
    // Type assertion needed: Zod v4 ZodObject has a `required()` method instead of
    // a `required` property, causing a type-level mismatch with the library's types.
    // Runtime behavior is correct — verified via Node.js execution.
    registry.registerComponent("schemas", "WarehouseListItem", WarehouseListItem);
    // ListWarehousesQuery is used inline as query params — no component registration needed.
    registry.registerPath({
        method: "get",
        path: "/api/v1/warehouses",
        tags: ["Warehouses"],
        summary: "List all warehouses",
        description: "Retrieves a paginated list of warehouses. Requires authentication. All roles permitted.",
        security: [{ cookieAuth: [] }],
        request: {
            query: ListWarehousesQuery,
        },
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
                description: "Unauthorized — invalid or missing session cookie",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            404: {
                description: "Route not found",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
        },
    });
}
