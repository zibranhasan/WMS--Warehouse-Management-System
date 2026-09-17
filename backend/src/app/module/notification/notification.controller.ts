import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { NotificationService } from "./notification.service.js";

const getAllNotifications = catchAsync(
    async (req: Request, res: Response) => {
        const userId = req.user.userId;
        const result = await NotificationService.getAllNotifications(
            userId,
            req.query,
        );

        sendResponse(res, {
            httpStatusCode: httpStatus.OK,
            success: true,
            message: "Notifications retrieved successfully.",
            meta: result.meta,
            data: result.data,
        });
    },
);

const getNotificationById = catchAsync(
    async (req: Request, res: Response) => {
        const userId = req.user.userId;
        const id = req.params.id as string;
        const result = await NotificationService.getNotificationById(
            userId,
            id,
        );

        sendResponse(res, {
            httpStatusCode: httpStatus.OK,
            success: true,
            message: "Notification retrieved successfully.",
            data: result,
        });
    },
);

const getUnreadCount = catchAsync(
    async (req: Request, res: Response) => {
        const userId = req.user.userId;
        const result = await NotificationService.getUnreadCount(userId);

        sendResponse(res, {
            httpStatusCode: httpStatus.OK,
            success: true,
            message: "Unread notification count retrieved successfully.",
            data: result,
        });
    },
);

const markAsRead = catchAsync(
    async (req: Request, res: Response) => {
        const userId = req.user.userId;
        const id = req.params.id as string;
        const result = await NotificationService.markAsRead(userId, id);

        sendResponse(res, {
            httpStatusCode: httpStatus.OK,
            success: true,
            message: "Notification marked as read successfully.",
            data: result,
        });
    },
);

const markAllAsRead = catchAsync(
    async (req: Request, res: Response) => {
        const userId = req.user.userId;
        const result = await NotificationService.markAllAsRead(userId);

        sendResponse(res, {
            httpStatusCode: httpStatus.OK,
            success: true,
            message: "All notifications marked as read successfully.",
            data: result,
        });
    },
);

const deleteNotification = catchAsync(
    async (req: Request, res: Response) => {
        const userId = req.user.userId;
        const id = req.params.id as string;
        const result = await NotificationService.deleteNotification(
            userId,
            id,
        );

        sendResponse(res, {
            httpStatusCode: httpStatus.OK,
            success: true,
            message: "Notification deleted successfully.",
            data: result,
        });
    },
);

export const NotificationController = {
    getAllNotifications,
    getNotificationById,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
