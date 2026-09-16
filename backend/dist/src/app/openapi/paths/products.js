import { z } from "zod";
import { PaginatedResponse, SuccessResponse, ErrorResponse } from "../components/responses";
import { ProductResponse } from "../components/schemas";
const CreateProductRequest = z
    .object({
    sku: z.string().min(1),
    name: z.string().min(1),
    slug: z.string().optional(),
    description: z.string().optional(),
    categoryId: z.string().min(1),
    brandId: z.string().nullable().optional(),
    unit: z.string().min(1),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
})
    .openapi("CreateProductRequest");
const UpdateProductRequest = z
    .object({
    sku: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    slug: z.string().optional(),
    description: z.string().nullable().optional(),
    categoryId: z.string().min(1).optional(),
    brandId: z.string().nullable().optional(),
    unit: z.string().min(1).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    removeImage: z.boolean().optional(),
})
    .openapi("UpdateProductRequest");
const UpdateProductStatusRequest = z
    .object({ status: z.enum(["ACTIVE", "INACTIVE"]) })
    .openapi("UpdateProductStatusRequest");
const ListProductsQuery = z
    .object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    searchTerm: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
    status: z.string().optional(),
    categoryId: z.string().optional(),
    brandId: z.string().optional(),
    fields: z.string().optional(),
})
    .openapi("ListProductsQuery");
export function registerProductPaths(registry) {
    registry.registerComponent("schemas", "CreateProductRequest", CreateProductRequest);
    registry.registerComponent("schemas", "UpdateProductRequest", UpdateProductRequest);
    registry.registerComponent("schemas", "UpdateProductStatusRequest", UpdateProductStatusRequest);
    registry.registerPath({
        method: "post", path: "/api/v1/products", operationId: "createProduct", tags: ["Products"], summary: "Create product",
        description: "Creates a new product. SKU must be unique. Category must be active. Brand must be active if provided. Accepts multipart/form-data with optional image.",
        security: [{ cookieAuth: [] }],
        request: {
            body: {
                content: {
                    "multipart/form-data": {
                        schema: {
                            type: "object",
                            required: ["sku", "name", "categoryId", "unit"],
                            properties: {
                                sku: { type: "string", description: "Unique stock keeping unit" },
                                name: { type: "string", description: "Product name" },
                                slug: { type: "string", description: "URL slug (auto-generated if omitted)" },
                                description: { type: "string", description: "Product description" },
                                categoryId: { type: "string", description: "Category ID" },
                                brandId: { type: "string", nullable: true, description: "Brand ID (nullable)" },
                                unit: { type: "string", description: "Unit of measure" },
                                status: { type: "string", enum: ["ACTIVE", "INACTIVE"], description: "Product status" },
                                image: { type: "string", format: "binary", description: "Product image (optional)" },
                            },
                        },
                    },
                },
            },
        },
        responses: {
            201: { description: "Product created successfully", content: { "application/json": { schema: SuccessResponse(ProductResponse) } } },
            400: { description: "Validation error or duplicate SKU", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "get", path: "/api/v1/products", operationId: "listProducts", tags: ["Products"], summary: "List all products",
        description: "Retrieves a paginated list of products with category and brand included.",
        security: [{ cookieAuth: [] }], request: { query: ListProductsQuery },
        responses: {
            200: { description: "Products retrieved successfully", content: { "application/json": { schema: PaginatedResponse(ProductResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "get", path: "/api/v1/products/sku/{sku}", operationId: "getProductBySku", tags: ["Products"], summary: "Get product by SKU",
        description: "Retrieves a single product by its unique SKU (stock keeping unit).",
        security: [{ cookieAuth: [] }],
        request: { params: z.object({ sku: z.string().describe("Product SKU") }) },
        responses: {
            200: { description: "Product fetched successfully", content: { "application/json": { schema: SuccessResponse(ProductResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Product not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "get", path: "/api/v1/products/{id}", operationId: "getProductById", tags: ["Products"], summary: "Get product by ID",
        description: "Retrieves a single product by ID with category and brand included.",
        security: [{ cookieAuth: [] }],
        request: { params: z.object({ id: z.string().describe("Product ID") }) },
        responses: {
            200: { description: "Product fetched successfully", content: { "application/json": { schema: SuccessResponse(ProductResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Product not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "patch", path: "/api/v1/products/{id}", operationId: "updateProduct", tags: ["Products"], summary: "Update product",
        description: "Updates product details. SKU uniqueness enforced. Accepts multipart/form-data with optional image. Old Cloudinary image deleted on replacement/removal.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Product ID") }),
            body: {
                content: {
                    "multipart/form-data": {
                        schema: {
                            type: "object",
                            properties: {
                                sku: { type: "string", description: "Unique stock keeping unit" },
                                name: { type: "string", description: "Product name" },
                                slug: { type: "string", description: "URL slug" },
                                description: { type: "string", nullable: true, description: "Product description" },
                                categoryId: { type: "string", description: "Category ID" },
                                brandId: { type: "string", nullable: true, description: "Brand ID (nullable)" },
                                unit: { type: "string", description: "Unit of measure" },
                                status: { type: "string", enum: ["ACTIVE", "INACTIVE"], description: "Product status" },
                                removeImage: { type: "boolean", description: "Set to true to remove the current image" },
                                image: { type: "string", format: "binary", description: "New product image (optional)" },
                            },
                        },
                    },
                },
            },
        },
        responses: {
            200: { description: "Product updated successfully", content: { "application/json": { schema: SuccessResponse(ProductResponse) } } },
            400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Product not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "patch", path: "/api/v1/products/{id}/status", operationId: "updateProductStatus", tags: ["Products"], summary: "Update product status",
        description: "Updates the status of a product.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Product ID") }),
            body: { content: { "application/json": { schema: UpdateProductStatusRequest } } },
        },
        responses: {
            200: { description: "Product status updated successfully", content: { "application/json": { schema: SuccessResponse(ProductResponse) } } },
            400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Product not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    registry.registerPath({
        method: "delete", path: "/api/v1/products/{id}", operationId: "deleteProduct", tags: ["Products"], summary: "Delete product",
        description: "Soft-deletes a product.",
        security: [{ cookieAuth: [] }],
        request: { params: z.object({ id: z.string().describe("Product ID") }) },
        responses: {
            200: { description: "Product deleted successfully", content: { "application/json": { schema: SuccessResponse(ProductResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Product not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
}
