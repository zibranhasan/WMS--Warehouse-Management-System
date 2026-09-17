import { z } from "zod";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { PaginatedResponse, SuccessResponse, ErrorResponse } from "../components/responses.js";
import { ZoneResponse, AisleResponse } from "../components/schemas.js";

const CreateZoneRequest = z
    .object({
        warehouseId: z.string().min(1),
        code: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        capacity: z.number().int().min(0).default(0).optional(),
    })
    .openapi("CreateZoneRequest");

const UpdateZoneRequest = z
    .object({
        warehouseId: z.string().min(1).optional(),
        code: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        capacity: z.number().int().min(0).optional(),
    })
    .openapi("UpdateZoneRequest");

const UpdateZoneStatusRequest = z
    .object({
        status: z.enum(["ACTIVE", "INACTIVE"]),
    })
    .openapi("UpdateZoneStatusRequest");

const ListZonesQuery = z
    .object({
        page: z.coerce.number().int().min(1).default(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
        searchTerm: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
        warehouseId: z.string().optional(),
        status: z.string().optional(),
    })
    .openapi("ListZonesQuery");

export function registerZonePaths(registry: OpenAPIRegistry) {
    registry.registerComponent("schemas", "CreateZoneRequest", CreateZoneRequest as never);
    registry.registerComponent("schemas", "UpdateZoneRequest", UpdateZoneRequest as never);
    registry.registerComponent("schemas", "UpdateZoneStatusRequest", UpdateZoneStatusRequest as never);

    registry.registerPath({
        method: "post",
        path: "/api/v1/zones",
        operationId: "createZone",
        tags: ["Zones"],
        summary: "Create zone",
        description:
            "Creates a new zone within a warehouse. Warehouse must be active. Zone code must be unique within the warehouse. Requires SUPER_ADMIN, ADMIN, or WAREHOUSE_MANAGER role.",
        security: [{ cookieAuth: [] }],
        request: {
            body: { content: { "application/json": { schema: CreateZoneRequest } } },
        },
        responses: {
            201: { description: "Zone created successfully", content: { "application/json": { schema: SuccessResponse(ZoneResponse) } } },
            400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "get",
        path: "/api/v1/zones",
        operationId: "listZones",
        tags: ["Zones"],
        summary: "List all zones",
        description: "Retrieves a paginated list of zones. Warehouse-scoped users see only their warehouse's zones.",
        security: [{ cookieAuth: [] }],
        request: { query: ListZonesQuery },
        responses: {
            200: { description: "Zones retrieved successfully", content: { "application/json": { schema: PaginatedResponse(ZoneResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "get",
        path: "/api/v1/zones/{id}",
        operationId: "getZoneById",
        tags: ["Zones"],
        summary: "Get zone by ID",
        description: "Retrieves a single zone with warehouse and aisles included.",
        security: [{ cookieAuth: [] }],
        request: { params: z.object({ id: z.string().describe("Zone ID") }) },
        responses: {
            200: { description: "Zone retrieved successfully", content: { "application/json": { schema: SuccessResponse(ZoneResponse) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Zone not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "get",
        path: "/api/v1/zones/{id}/aisles",
        operationId: "getZoneAisles",
        tags: ["Zones"],
        summary: "Get zone aisles",
        description: "Retrieves all aisles within a zone, including their shelves.",
        security: [{ cookieAuth: [] }],
        request: { params: z.object({ id: z.string().describe("Zone ID") }) },
        responses: {
            200: { description: "Zone aisles retrieved successfully", content: { "application/json": { schema: SuccessResponse(z.array(AisleResponse)) } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Zone not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "patch",
        path: "/api/v1/zones/{id}",
        operationId: "updateZone",
        tags: ["Zones"],
        summary: "Update zone",
        description: "Updates zone details. Cannot move a zone to another warehouse if active aisles exist.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Zone ID") }),
            body: { content: { "application/json": { schema: UpdateZoneRequest } } },
        },
        responses: {
            200: { description: "Zone updated successfully", content: { "application/json": { schema: SuccessResponse(ZoneResponse) } } },
            400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Zone not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "patch",
        path: "/api/v1/zones/{id}/status",
        operationId: "updateZoneStatus",
        tags: ["Zones"],
        summary: "Update zone status",
        description: "Updates the status of a zone.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Zone ID") }),
            body: { content: { "application/json": { schema: UpdateZoneStatusRequest } } },
        },
        responses: {
            200: { description: "Zone status updated successfully", content: { "application/json": { schema: SuccessResponse(ZoneResponse) } } },
            400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Zone not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    registry.registerPath({
        method: "delete",
        path: "/api/v1/zones/{id}",
        operationId: "deleteZone",
        tags: ["Zones"],
        summary: "Delete zone",
        description: "Soft-deletes a zone. Cannot delete if active aisles exist.",
        security: [{ cookieAuth: [] }],
        request: { params: z.object({ id: z.string().describe("Zone ID") }) },
        responses: {
            200: { description: "Zone deleted successfully", content: { "application/json": { schema: SuccessResponse(ZoneResponse) } } },
            400: { description: "Cannot delete zone with active aisles", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Zone not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
}
