import { z } from "zod";
import { PaginatedResponse, SuccessResponse, ErrorResponse } from "../components/responses";
import { BinResponse } from "../components/schemas";
const CreateBinRequest = z
    .object({
    shelfId: z.string().min(1),
    code: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    capacity: z.number().int().min(0).default(0).optional(),
})
    .openapi("CreateBinRequest");
const UpdateBinRequest = z
    .object({
    shelfId: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    capacity: z.number().int().min(0).optional(),
})
    .openapi("UpdateBinRequest");
const UpdateBinStatusRequest = z
    .object({ status: z.enum(["ACTIVE", "INACTIVE"]) })
    .openapi("UpdateBinStatusRequest");
const ListBinsQuery = z
    .object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    searchTerm: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
    warehouseId: z.string().optional(),
    zoneId: z.string().optional(),
    aisleId: z.string().optional(),
    status: z.string().optional(),
})
    .openapi("ListBinsQuery");
export function registerBinPaths(registry) {
    registry.registerComponent("schemas", "CreateBinRequest", CreateBinRequest);
    registry.registerComponent("schemas", "UpdateBinRequest", UpdateBinRequest);
    registry.registerComponent("schemas", "UpdateBinStatusRequest", UpdateBinStatusRequest);
    registry.registerPath({
        method: "post", path: "/api/v1/bins", operationId: "createBin", tags: ["Bins"], summary: "Create bin",
        description: "Creates a new bin within a shelf. Shelf must be active. Code must be unique within the shelf.",
        security: [{ cookieAuth: [] }],
        request: { body: { content: { "application/json": { schema: CreateBinRequest } } } },
        responses: {
            201: { description: "Bin created successfully", content: { "application/json": { schema: SuccessResponse(BinResponse) } } },
            400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "get", path: "/api/v1/bins", operationId: "listBins", tags: ["Bins"], summary: "List all bins",
        description: "Retrieves a paginated list of bins with shelf, aisle, zone, warehouse, and computed capacity fields.",
        security: [{ cookieAuth: [] }], request: { query: ListBinsQuery },
        responses: {
            200: { description: "Bins retrieved successfully", content: { "application/json": { schema: PaginatedResponse(BinResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "get", path: "/api/v1/bins/{id}", operationId: "getBinById", tags: ["Bins"], summary: "Get bin by ID",
        description: "Retrieves a single bin with shelf included.",
        security: [{ cookieAuth: [] }],
        request: { params: z.object({ id: z.string().describe("Bin ID") }) },
        responses: {
            200: { description: "Bin retrieved successfully", content: { "application/json": { schema: SuccessResponse(BinResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Bin not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "patch", path: "/api/v1/bins/{id}", operationId: "updateBin", tags: ["Bins"], summary: "Update bin",
        description: "Updates bin details. Target shelf must be active if changing shelves.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Bin ID") }),
            body: { content: { "application/json": { schema: UpdateBinRequest } } },
        },
        responses: {
            200: { description: "Bin updated successfully", content: { "application/json": { schema: SuccessResponse(BinResponse) } } },
            400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Bin not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "patch", path: "/api/v1/bins/{id}/status", operationId: "updateBinStatus", tags: ["Bins"], summary: "Update bin status",
        description: "Updates the status of a bin.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Bin ID") }),
            body: { content: { "application/json": { schema: UpdateBinStatusRequest } } },
        },
        responses: {
            200: { description: "Bin status updated successfully", content: { "application/json": { schema: SuccessResponse(BinResponse) } } },
            400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Bin not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "delete", path: "/api/v1/bins/{id}", operationId: "deleteBin", tags: ["Bins"], summary: "Delete bin",
        description: "Soft-deletes a bin.",
        security: [{ cookieAuth: [] }],
        request: { params: z.object({ id: z.string().describe("Bin ID") }) },
        responses: {
            200: { description: "Bin deleted successfully", content: { "application/json": { schema: SuccessResponse(BinResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Bin not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
}
