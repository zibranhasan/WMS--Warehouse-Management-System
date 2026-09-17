import { z } from "zod";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { PaginatedResponse, SuccessResponse, ErrorResponse } from "../components/responses.js";
import { SupplierResponse } from "../components/schemas.js";

const CreateSupplierRequest = z
    .object({
        name: z.string().min(1),
        slug: z.string().optional(),
        contactPerson: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    })
    .openapi("CreateSupplierRequest");

const UpdateSupplierRequest = z
    .object({
        name: z.string().min(1).optional(),
        slug: z.string().optional(),
        contactPerson: z.string().nullable().optional(),
        email: z.string().email().nullable().optional(),
        phone: z.string().nullable().optional(),
        address: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    })
    .openapi("UpdateSupplierRequest");

const UpdateSupplierStatusRequest = z
    .object({ status: z.enum(["ACTIVE", "INACTIVE"]) })
    .openapi("UpdateSupplierStatusRequest");

const ListSuppliersQuery = z
    .object({
        page: z.coerce.number().int().min(1).default(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
        searchTerm: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
        status: z.string().optional(),
        fields: z.string().optional(),
    })
    .openapi("ListSuppliersQuery");

export function registerSupplierPaths(registry: OpenAPIRegistry) {
    registry.registerComponent("schemas", "CreateSupplierRequest", CreateSupplierRequest as never);
    registry.registerComponent("schemas", "UpdateSupplierRequest", UpdateSupplierRequest as never);
    registry.registerComponent("schemas", "UpdateSupplierStatusRequest", UpdateSupplierStatusRequest as never);

    registry.registerPath({
        method: "post", path: "/api/v1/suppliers", operationId: "createSupplier", tags: ["Suppliers"], summary: "Create supplier",
        description: "Creates a new supplier. Name must be unique. Slug is auto-generated with retry logic for uniqueness.",
        security: [{ cookieAuth: [] }],
        request: { body: { content: { "application/json": { schema: CreateSupplierRequest } } } },
        responses: {
            201: { description: "Supplier created successfully", content: { "application/json": { schema: SuccessResponse(SupplierResponse) } } },
            400: { description: "Validation error or duplicate name", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "get", path: "/api/v1/suppliers", operationId: "listSuppliers", tags: ["Suppliers"], summary: "List all suppliers",
        description: "Retrieves a paginated list of suppliers.",
        security: [{ cookieAuth: [] }], request: { query: ListSuppliersQuery },
        responses: {
            200: { description: "Suppliers retrieved successfully", content: { "application/json": { schema: PaginatedResponse(SupplierResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "get", path: "/api/v1/suppliers/{id}", operationId: "getSupplierById", tags: ["Suppliers"], summary: "Get supplier by ID",
        description: "Retrieves a single supplier by ID.",
        security: [{ cookieAuth: [] }],
        request: { params: z.object({ id: z.string().describe("Supplier ID") }) },
        responses: {
            200: { description: "Supplier fetched successfully", content: { "application/json": { schema: SuccessResponse(SupplierResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Supplier not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "patch", path: "/api/v1/suppliers/{id}", operationId: "updateSupplier", tags: ["Suppliers"], summary: "Update supplier",
        description: "Updates supplier details. Name uniqueness enforced. Slug re-generated with retry if name changes.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Supplier ID") }),
            body: { content: { "application/json": { schema: UpdateSupplierRequest } } },
        },
        responses: {
            200: { description: "Supplier updated successfully", content: { "application/json": { schema: SuccessResponse(SupplierResponse) } } },
            400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Supplier not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "patch", path: "/api/v1/suppliers/{id}/status", operationId: "updateSupplierStatus", tags: ["Suppliers"], summary: "Update supplier status",
        description: "Updates the status of a supplier.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Supplier ID") }),
            body: { content: { "application/json": { schema: UpdateSupplierStatusRequest } } },
        },
        responses: {
            200: { description: "Supplier status updated successfully", content: { "application/json": { schema: SuccessResponse(SupplierResponse) } } },
            400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Supplier not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "delete", path: "/api/v1/suppliers/{id}", operationId: "deleteSupplier", tags: ["Suppliers"], summary: "Delete supplier",
        description: "Soft-deletes a supplier.",
        security: [{ cookieAuth: [] }],
        request: { params: z.object({ id: z.string().describe("Supplier ID") }) },
        responses: {
            200: { description: "Supplier deleted successfully", content: { "application/json": { schema: SuccessResponse(SupplierResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Supplier not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
}
