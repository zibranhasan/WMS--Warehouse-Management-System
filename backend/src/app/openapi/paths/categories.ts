import { z } from "zod";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { PaginatedResponse, SuccessResponse, ErrorResponse } from "../components/responses.js";
import { CategoryResponse } from "../components/schemas.js";

const CreateCategoryRequest = z
    .object({
        name: z.string().min(1),
        slug: z.string().optional(),
        description: z.string().optional(),
    })
    .openapi("CreateCategoryRequest");

const UpdateCategoryRequest = z
    .object({
        name: z.string().min(1).optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    })
    .openapi("UpdateCategoryRequest");

const UpdateCategoryStatusRequest = z
    .object({ status: z.enum(["ACTIVE", "INACTIVE"]) })
    .openapi("UpdateCategoryStatusRequest");

const ListCategoriesQuery = z
    .object({
        page: z.coerce.number().int().min(1).default(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
        searchTerm: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
        status: z.string().optional(),
        fields: z.string().optional(),
    })
    .openapi("ListCategoriesQuery");

export function registerCategoryPaths(registry: OpenAPIRegistry) {
    registry.registerComponent("schemas", "CreateCategoryRequest", CreateCategoryRequest as never);
    registry.registerComponent("schemas", "UpdateCategoryRequest", UpdateCategoryRequest as never);
    registry.registerComponent("schemas", "UpdateCategoryStatusRequest", UpdateCategoryStatusRequest as never);

    registry.registerPath({
        method: "post", path: "/api/v1/categories", operationId: "createCategory", tags: ["Categories"], summary: "Create category",
        description: "Creates a new category. Name must be unique. Slug is auto-generated from name if not provided.",
        security: [{ cookieAuth: [] }],
        request: { body: { content: { "application/json": { schema: CreateCategoryRequest } } } },
        responses: {
            201: { description: "Category created successfully", content: { "application/json": { schema: SuccessResponse(CategoryResponse) } } },
            400: { description: "Validation error or duplicate name/slug", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "get", path: "/api/v1/categories", operationId: "listCategories", tags: ["Categories"], summary: "List all categories",
        description: "Retrieves a paginated list of categories.",
        security: [{ cookieAuth: [] }], request: { query: ListCategoriesQuery },
        responses: {
            200: { description: "Categories retrieved successfully", content: { "application/json": { schema: PaginatedResponse(CategoryResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "get", path: "/api/v1/categories/{id}", operationId: "getCategoryById", tags: ["Categories"], summary: "Get category by ID",
        description: "Retrieves a single category by ID.",
        security: [{ cookieAuth: [] }],
        request: { params: z.object({ id: z.string().describe("Category ID") }) },
        responses: {
            200: { description: "Category retrieved successfully", content: { "application/json": { schema: SuccessResponse(CategoryResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Category not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "patch", path: "/api/v1/categories/{id}", operationId: "updateCategory", tags: ["Categories"], summary: "Update category",
        description: "Updates category details. Name/slug uniqueness enforced. Slug auto-regenerated if name changes.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Category ID") }),
            body: { content: { "application/json": { schema: UpdateCategoryRequest } } },
        },
        responses: {
            200: { description: "Category updated successfully", content: { "application/json": { schema: SuccessResponse(CategoryResponse) } } },
            400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Category not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "patch", path: "/api/v1/categories/{id}/status", operationId: "updateCategoryStatus", tags: ["Categories"], summary: "Update category status",
        description: "Updates the status of a category.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Category ID") }),
            body: { content: { "application/json": { schema: UpdateCategoryStatusRequest } } },
        },
        responses: {
            200: { description: "Category status updated successfully", content: { "application/json": { schema: SuccessResponse(CategoryResponse) } } },
            400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Category not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "delete", path: "/api/v1/categories/{id}", operationId: "deleteCategory", tags: ["Categories"], summary: "Delete category",
        description: "Soft-deletes a category.",
        security: [{ cookieAuth: [] }],
        request: { params: z.object({ id: z.string().describe("Category ID") }) },
        responses: {
            200: { description: "Category deleted successfully", content: { "application/json": { schema: SuccessResponse(CategoryResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Category not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
}
