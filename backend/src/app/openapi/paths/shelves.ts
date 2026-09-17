import { z } from "zod";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { PaginatedResponse, SuccessResponse, ErrorResponse } from "../components/responses.js";
import { ShelfResponse, BinResponse } from "../components/schemas.js";

const CreateShelfRequest = z
    .object({
        aisleId: z.string().min(1),
        code: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        capacity: z.number().int().min(0).default(0).optional(),
    })
    .openapi("CreateShelfRequest");

const UpdateShelfRequest = z
    .object({
        aisleId: z.string().min(1).optional(),
        code: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        capacity: z.number().int().min(0).optional(),
    })
    .openapi("UpdateShelfRequest");

const UpdateShelfStatusRequest = z
    .object({ status: z.enum(["ACTIVE", "INACTIVE"]) })
    .openapi("UpdateShelfStatusRequest");

const ListShelvesQuery = z
    .object({
        page: z.coerce.number().int().min(1).default(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
        searchTerm: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
        warehouseId: z.string().optional(),
        zoneId: z.string().optional(),
        status: z.string().optional(),
    })
    .openapi("ListShelvesQuery");

export function registerShelfPaths(registry: OpenAPIRegistry) {
    registry.registerComponent("schemas", "CreateShelfRequest", CreateShelfRequest as never);
    registry.registerComponent("schemas", "UpdateShelfRequest", UpdateShelfRequest as never);
    registry.registerComponent("schemas", "UpdateShelfStatusRequest", UpdateShelfStatusRequest as never);

    registry.registerPath({
        method: "post", path: "/api/v1/shelves", operationId: "createShelf", tags: ["Shelves"], summary: "Create shelf",
        description: "Creates a new shelf within an aisle. Aisle must be active. Code must be unique within the aisle.",
        security: [{ cookieAuth: [] }],
        request: { body: { content: { "application/json": { schema: CreateShelfRequest } } } },
        responses: {
            201: { description: "Shelf created successfully", content: { "application/json": { schema: SuccessResponse(ShelfResponse) } } },
            400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "get", path: "/api/v1/shelves", operationId: "listShelves", tags: ["Shelves"], summary: "List all shelves",
        description: "Retrieves a paginated list of shelves with aisle, zone, and warehouse included.",
        security: [{ cookieAuth: [] }], request: { query: ListShelvesQuery },
        responses: {
            200: { description: "Shelves retrieved successfully", content: { "application/json": { schema: PaginatedResponse(ShelfResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "get", path: "/api/v1/shelves/{id}", operationId: "getShelfById", tags: ["Shelves"], summary: "Get shelf by ID",
        description: "Retrieves a single shelf with aisle and bins included.",
        security: [{ cookieAuth: [] }],
        request: { params: z.object({ id: z.string().describe("Shelf ID") }) },
        responses: {
            200: { description: "Shelf retrieved successfully", content: { "application/json": { schema: SuccessResponse(ShelfResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Shelf not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "get", path: "/api/v1/shelves/{id}/bins", operationId: "getShelfBins", tags: ["Shelves"], summary: "Get shelf bins",
        description: "Retrieves all bins within a shelf.",
        security: [{ cookieAuth: [] }],
        request: { params: z.object({ id: z.string().describe("Shelf ID") }) },
        responses: {
            200: { description: "Shelf bins retrieved successfully", content: { "application/json": { schema: SuccessResponse(z.array(BinResponse)) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Shelf not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "patch", path: "/api/v1/shelves/{id}", operationId: "updateShelf", tags: ["Shelves"], summary: "Update shelf",
        description: "Updates shelf details. Cannot move to another aisle if active bins exist.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Shelf ID") }),
            body: { content: { "application/json": { schema: UpdateShelfRequest } } },
        },
        responses: {
            200: { description: "Shelf updated successfully", content: { "application/json": { schema: SuccessResponse(ShelfResponse) } } },
            400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Shelf not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "patch", path: "/api/v1/shelves/{id}/status", operationId: "updateShelfStatus", tags: ["Shelves"], summary: "Update shelf status",
        description: "Updates the status of a shelf.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Shelf ID") }),
            body: { content: { "application/json": { schema: UpdateShelfStatusRequest } } },
        },
        responses: {
            200: { description: "Shelf status updated successfully", content: { "application/json": { schema: SuccessResponse(ShelfResponse) } } },
            400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Shelf not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "delete", path: "/api/v1/shelves/{id}", operationId: "deleteShelf", tags: ["Shelves"], summary: "Delete shelf",
        description: "Soft-deletes a shelf. Cannot delete if active bins exist.",
        security: [{ cookieAuth: [] }],
        request: { params: z.object({ id: z.string().describe("Shelf ID") }) },
        responses: {
            200: { description: "Shelf deleted successfully", content: { "application/json": { schema: SuccessResponse(ShelfResponse) } } },
            400: { description: "Cannot delete shelf with active bins", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Shelf not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
}
