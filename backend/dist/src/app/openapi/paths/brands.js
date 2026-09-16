import { z } from "zod";
import { PaginatedResponse, SuccessResponse, ErrorResponse } from "../components/responses";
import { BrandResponse } from "../components/schemas";
const CreateBrandRequest = z
    .object({
    name: z.string().min(1),
    slug: z.string().optional(),
    description: z.string().optional(),
})
    .openapi("CreateBrandRequest");
const UpdateBrandRequest = z
    .object({
    name: z.string().min(1).optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
})
    .openapi("UpdateBrandRequest");
const UpdateBrandStatusRequest = z
    .object({ status: z.enum(["ACTIVE", "INACTIVE"]) })
    .openapi("UpdateBrandStatusRequest");
const ListBrandsQuery = z
    .object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    searchTerm: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
    status: z.string().optional(),
    fields: z.string().optional(),
})
    .openapi("ListBrandsQuery");
export function registerBrandPaths(registry) {
    registry.registerComponent("schemas", "CreateBrandRequest", CreateBrandRequest);
    registry.registerComponent("schemas", "UpdateBrandRequest", UpdateBrandRequest);
    registry.registerComponent("schemas", "UpdateBrandStatusRequest", UpdateBrandStatusRequest);
    registry.registerPath({
        method: "post", path: "/api/v1/brands", operationId: "createBrand", tags: ["Brands"], summary: "Create brand",
        description: "Creates a new brand. Name must be unique. Slug is auto-generated with retry logic for uniqueness.",
        security: [{ cookieAuth: [] }],
        request: { body: { content: { "application/json": { schema: CreateBrandRequest } } } },
        responses: {
            201: { description: "Brand created successfully", content: { "application/json": { schema: SuccessResponse(BrandResponse) } } },
            400: { description: "Validation error or duplicate name", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "get", path: "/api/v1/brands", operationId: "listBrands", tags: ["Brands"], summary: "List all brands",
        description: "Retrieves a paginated list of brands.",
        security: [{ cookieAuth: [] }], request: { query: ListBrandsQuery },
        responses: {
            200: { description: "Brands retrieved successfully", content: { "application/json": { schema: PaginatedResponse(BrandResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "get", path: "/api/v1/brands/{id}", operationId: "getBrandById", tags: ["Brands"], summary: "Get brand by ID",
        description: "Retrieves a single brand by ID.",
        security: [{ cookieAuth: [] }],
        request: { params: z.object({ id: z.string().describe("Brand ID") }) },
        responses: {
            200: { description: "Brand retrieved successfully", content: { "application/json": { schema: SuccessResponse(BrandResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Brand not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "patch", path: "/api/v1/brands/{id}", operationId: "updateBrand", tags: ["Brands"], summary: "Update brand",
        description: "Updates brand details. Name uniqueness enforced. Slug re-generated with retry if name changes.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Brand ID") }),
            body: { content: { "application/json": { schema: UpdateBrandRequest } } },
        },
        responses: {
            200: { description: "Brand updated successfully", content: { "application/json": { schema: SuccessResponse(BrandResponse) } } },
            400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Brand not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "patch", path: "/api/v1/brands/{id}/status", operationId: "updateBrandStatus", tags: ["Brands"], summary: "Update brand status",
        description: "Updates the status of a brand.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Brand ID") }),
            body: { content: { "application/json": { schema: UpdateBrandStatusRequest } } },
        },
        responses: {
            200: { description: "Brand status updated successfully", content: { "application/json": { schema: SuccessResponse(BrandResponse) } } },
            400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Brand not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "delete", path: "/api/v1/brands/{id}", operationId: "deleteBrand", tags: ["Brands"], summary: "Delete brand",
        description: "Soft-deletes a brand.",
        security: [{ cookieAuth: [] }],
        request: { params: z.object({ id: z.string().describe("Brand ID") }) },
        responses: {
            200: { description: "Brand deleted successfully", content: { "application/json": { schema: SuccessResponse(BrandResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Brand not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
}
