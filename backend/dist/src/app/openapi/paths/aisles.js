import { z } from "zod";
import { PaginatedResponse, SuccessResponse, ErrorResponse } from "../components/responses";
import { AisleResponse, ShelfResponse } from "../components/schemas";
const CreateAisleRequest = z
    .object({
    zoneId: z.string().min(1),
    code: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    capacity: z.number().int().min(0).default(0).optional(),
})
    .openapi("CreateAisleRequest");
const UpdateAisleRequest = z
    .object({
    zoneId: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    capacity: z.number().int().min(0).optional(),
})
    .openapi("UpdateAisleRequest");
const UpdateAisleStatusRequest = z
    .object({ status: z.enum(["ACTIVE", "INACTIVE"]) })
    .openapi("UpdateAisleStatusRequest");
const ListAislesQuery = z
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
    .openapi("ListAislesQuery");
export function registerAislePaths(registry) {
    registry.registerComponent("schemas", "CreateAisleRequest", CreateAisleRequest);
    registry.registerComponent("schemas", "UpdateAisleRequest", UpdateAisleRequest);
    registry.registerComponent("schemas", "UpdateAisleStatusRequest", UpdateAisleStatusRequest);
    registry.registerPath({
        method: "post", path: "/api/v1/aisles", operationId: "createAisle", tags: ["Aisles"], summary: "Create aisle",
        description: "Creates a new aisle within a zone. Zone must be active. Code must be unique within the zone.",
        security: [{ cookieAuth: [] }],
        request: { body: { content: { "application/json": { schema: CreateAisleRequest } } } },
        responses: {
            201: { description: "Aisle created successfully", content: { "application/json": { schema: SuccessResponse(AisleResponse) } } },
            400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "get", path: "/api/v1/aisles", operationId: "listAisles", tags: ["Aisles"], summary: "List all aisles",
        description: "Retrieves a paginated list of aisles with zone and warehouse included.",
        security: [{ cookieAuth: [] }], request: { query: ListAislesQuery },
        responses: {
            200: { description: "Aisles retrieved successfully", content: { "application/json": { schema: PaginatedResponse(AisleResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "get", path: "/api/v1/aisles/{id}", operationId: "getAisleById", tags: ["Aisles"], summary: "Get aisle by ID",
        description: "Retrieves a single aisle with zone and shelves included.",
        security: [{ cookieAuth: [] }],
        request: { params: z.object({ id: z.string().describe("Aisle ID") }) },
        responses: {
            200: { description: "Aisle retrieved successfully", content: { "application/json": { schema: SuccessResponse(AisleResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Aisle not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "get", path: "/api/v1/aisles/{id}/shelves", operationId: "getAisleShelves", tags: ["Aisles"], summary: "Get aisle shelves",
        description: "Retrieves all shelves within an aisle, including their bins.",
        security: [{ cookieAuth: [] }],
        request: { params: z.object({ id: z.string().describe("Aisle ID") }) },
        responses: {
            200: { description: "Aisle shelves retrieved successfully", content: { "application/json": { schema: SuccessResponse(z.array(ShelfResponse)) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Aisle not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "patch", path: "/api/v1/aisles/{id}", operationId: "updateAisle", tags: ["Aisles"], summary: "Update aisle",
        description: "Updates aisle details. Cannot move to another zone if active shelves exist.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Aisle ID") }),
            body: { content: { "application/json": { schema: UpdateAisleRequest } } },
        },
        responses: {
            200: { description: "Aisle updated successfully", content: { "application/json": { schema: SuccessResponse(AisleResponse) } } },
            400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Aisle not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "patch", path: "/api/v1/aisles/{id}/status", operationId: "updateAisleStatus", tags: ["Aisles"], summary: "Update aisle status",
        description: "Updates the status of an aisle.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Aisle ID") }),
            body: { content: { "application/json": { schema: UpdateAisleStatusRequest } } },
        },
        responses: {
            200: { description: "Aisle status updated successfully", content: { "application/json": { schema: SuccessResponse(AisleResponse) } } },
            400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Aisle not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "delete", path: "/api/v1/aisles/{id}", operationId: "deleteAisle", tags: ["Aisles"], summary: "Delete aisle",
        description: "Soft-deletes an aisle. Cannot delete if active shelves exist.",
        security: [{ cookieAuth: [] }],
        request: { params: z.object({ id: z.string().describe("Aisle ID") }) },
        responses: {
            200: { description: "Aisle deleted successfully", content: { "application/json": { schema: SuccessResponse(AisleResponse) } } },
            400: { description: "Cannot delete aisle with active shelves", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Aisle not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
}
