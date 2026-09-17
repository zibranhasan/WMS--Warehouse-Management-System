import { z } from "zod";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { PaginatedResponse, SuccessResponse, ErrorResponse } from "../components/responses.js";

// ─── Response schemas ─────────────────────────────────────────────────

const NotificationResponse = z
    .object({
        id: z.string(),
        userId: z.string(),
        type: z.enum(["INFO", "SUCCESS", "WARNING", "ERROR", "SYSTEM"]),
        title: z.string(),
        message: z.string(),
        isRead: z.boolean(),
        readAt: z.string().nullable().optional(),
        entityType: z.string().nullable().optional(),
        entityId: z.string().nullable().optional(),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .openapi("Notification");

const UnreadCountResponse = z
    .object({
        count: z.number(),
    })
    .openapi("UnreadCount");

const MarkAllAsReadResponse = z
    .object({
        count: z.number(),
    })
    .openapi("MarkAllAsReadResponse");

// ─── Query schemas ───────────────────────────────────────────────────

const NotificationListQuery = z
    .object({
        page: z.coerce.number().int().min(1).default(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
        searchTerm: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
        isRead: z
            .string()
            .transform((val) => val === "true")
            .optional(),
        type: z.enum(["INFO", "SUCCESS", "WARNING", "ERROR", "SYSTEM"]).optional(),
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
    })
    .openapi("NotificationListQuery");

// ─── Register paths ──────────────────────────────────────────────────

export function registerNotificationPaths(registry: OpenAPIRegistry) {
    registry.registerComponent("schemas", "Notification", NotificationResponse as never);
    registry.registerComponent("schemas", "UnreadCount", UnreadCountResponse as never);
    registry.registerComponent("schemas", "MarkAllAsReadResponse", MarkAllAsReadResponse as never);

    // ─── GET UNREAD COUNT ─────────────────────────────────────────────

    // 1. GET /api/v1/notifications/unread-count
    registry.registerPath({
        method: "get",
        path: "/api/v1/notifications/unread-count",
        operationId: "getUnreadNotificationCount",
        tags: ["Notifications"],
        summary: "Get unread notification count",
        description:
            "Returns the count of unread notifications for the authenticated user. Useful for badge indicators in the UI. Requires authentication (any role).",
        security: [{ cookieAuth: [] }],
        responses: {
            200: {
                description: "Unread count retrieved successfully",
                content: { "application/json": { schema: SuccessResponse(UnreadCountResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── MARK ALL AS READ ─────────────────────────────────────────────

    // 2. PATCH /api/v1/notifications/read-all
    registry.registerPath({
        method: "patch",
        path: "/api/v1/notifications/read-all",
        operationId: "markAllNotificationsRead",
        tags: ["Notifications"],
        summary: "Mark all notifications as read",
        description:
            "Marks all unread notifications for the authenticated user as read. Sets isRead to true and readAt to the current timestamp for all unread notifications. Returns the count of notifications that were updated. Requires authentication (any role).",
        security: [{ cookieAuth: [] }],
        responses: {
            200: {
                description: "All notifications marked as read successfully",
                content: { "application/json": { schema: SuccessResponse(MarkAllAsReadResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── LIST NOTIFICATIONS ───────────────────────────────────────────

    // 3. GET /api/v1/notifications
    registry.registerPath({
        method: "get",
        path: "/api/v1/notifications",
        operationId: "listNotifications",
        tags: ["Notifications"],
        summary: "List notifications",
        description:
            "Retrieves a paginated list of notifications scoped to the authenticated user. Supports search by title and message. Filterable by isRead, type, entityType, entityId, createdAt, and updatedAt. Requires authentication (any role).",
        security: [{ cookieAuth: [] }],
        request: { query: NotificationListQuery },
        responses: {
            200: {
                description: "Notifications retrieved successfully",
                content: { "application/json": { schema: PaginatedResponse(NotificationResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── GET NOTIFICATION BY ID ───────────────────────────────────────

    // 4. GET /api/v1/notifications/:id
    registry.registerPath({
        method: "get",
        path: "/api/v1/notifications/{id}",
        operationId: "getNotificationById",
        tags: ["Notifications"],
        summary: "Get notification by ID",
        description:
            "Retrieves a single notification by its ID. Only returns notifications owned by the authenticated user. Requires authentication (any role).",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Notification ID") }),
        },
        responses: {
            200: {
                description: "Notification retrieved successfully",
                content: { "application/json": { schema: SuccessResponse(NotificationResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Notification not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── MARK SINGLE AS READ ──────────────────────────────────────────

    // 5. PATCH /api/v1/notifications/:id/read
    registry.registerPath({
        method: "patch",
        path: "/api/v1/notifications/{id}/read",
        operationId: "markNotificationRead",
        tags: ["Notifications"],
        summary: "Mark notification as read",
        description:
            "Marks a single notification as read for the authenticated user. Idempotent — if the notification is already read, returns the existing record without modification. Sets isRead to true and readAt to the current timestamp. Requires authentication (any role).",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Notification ID") }),
        },
        responses: {
            200: {
                description: "Notification marked as read successfully",
                content: { "application/json": { schema: SuccessResponse(NotificationResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Notification not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });

    // ─── DELETE NOTIFICATION ───────────────────────────────────────────

    // 6. DELETE /api/v1/notifications/:id
    registry.registerPath({
        method: "delete",
        path: "/api/v1/notifications/{id}",
        operationId: "deleteNotification",
        tags: ["Notifications"],
        summary: "Delete notification",
        description:
            "Permanently deletes a notification. Only notifications owned by the authenticated user can be deleted. This action cannot be undone. Requires authentication (any role).",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Notification ID") }),
        },
        responses: {
            200: {
                description: "Notification deleted successfully",
                content: { "application/json": { schema: SuccessResponse(NotificationResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Notification not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
}
