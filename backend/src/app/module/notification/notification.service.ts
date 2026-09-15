import httpStatus from "http-status";
import {
    Notification,
    NotificationType,
} from "../../../generated/prisma/index.js";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
    notificationFilterableFields,
    notificationSearchableFields,
} from "./notification.constant";
import { emitNotificationCreated } from "../../socket";
import { ICreateNotificationPayload } from "./notification.interface";

/**
 * Internal service method for future business events to create notifications.
 * Persists to PostgreSQL first, then safely emits a real-time event to user:<userId>.
 */
const createNotification = async (
    payload: ICreateNotificationPayload,
): Promise<Notification> => {
    // 1. Persist notification to PostgreSQL first
    const result = await prisma.notification.create({
        data: {
            userId: payload.userId,
            title: payload.title,
            message: payload.message,
            type: payload.type || NotificationType.INFO,
            entityType: payload.entityType || null,
            entityId: payload.entityId || null,
            isRead: false,
        },
    });

    // 2. Safely emit real-time Socket.IO event to the recipient's private room
    emitNotificationCreated(result);

    // 3. Return the persisted notification
    return result;
};


/**
 * Retrieves paginated notifications strictly scoped to the authenticated user.
 */
const getAllNotifications = async (
    userId: string,
    query: Record<string, unknown>,
) => {
    const queryBuilder = new QueryBuilder<Notification>(
        prisma.notification,
        query as IQueryParams,
        {
            searchableFields: notificationSearchableFields,
            filterableFields: notificationFilterableFields,
        },
    )
        .where({ userId })
        .search()
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await queryBuilder.execute();
    return result;
};

/**
 * Retrieves a single notification strictly owned by the authenticated user.
 */
const getNotificationById = async (
    userId: string,
    id: string,
): Promise<Notification> => {
    const notification = await prisma.notification.findFirst({
        where: {
            id,
            userId,
        },
    });

    if (!notification) {
        throw new AppError(httpStatus.NOT_FOUND, "Notification not found.");
    }

    return notification;
};

/**
 * Retrieves unread notification count for the authenticated user.
 */
const getUnreadCount = async (
    userId: string,
): Promise<{ count: number }> => {
    const count = await prisma.notification.count({
        where: {
            userId,
            isRead: false,
        },
    });

    return { count };
};

/**
 * Marks a single notification as read for the authenticated user.
 * Idempotent operation: if already read, returns the existing record.
 */
const markAsRead = async (
    userId: string,
    id: string,
): Promise<Notification> => {
    const notification = await prisma.notification.findFirst({
        where: {
            id,
            userId,
        },
    });

    if (!notification) {
        throw new AppError(httpStatus.NOT_FOUND, "Notification not found.");
    }

    if (notification.isRead) {
        return notification;
    }

    const updatedNotification = await prisma.notification.update({
        where: { id },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    });

    return updatedNotification;
};

/**
 * Marks all unread notifications as read for the authenticated user.
 */
const markAllAsRead = async (
    userId: string,
): Promise<{ count: number }> => {
    const result = await prisma.notification.updateMany({
        where: {
            userId,
            isRead: false,
        },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    });

    return { count: result.count };
};

/**
 * Deletes a notification strictly owned by the authenticated user.
 */
const deleteNotification = async (
    userId: string,
    id: string,
): Promise<Notification> => {
    const notification = await prisma.notification.findFirst({
        where: {
            id,
            userId,
        },
    });

    if (!notification) {
        throw new AppError(httpStatus.NOT_FOUND, "Notification not found.");
    }

    const deletedNotification = await prisma.notification.delete({
        where: { id },
    });

    return deletedNotification;
};

export const NotificationService = {
    createNotification,
    getAllNotifications,
    getNotificationById,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
