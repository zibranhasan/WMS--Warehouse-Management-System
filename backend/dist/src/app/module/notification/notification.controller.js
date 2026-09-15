import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { NotificationService } from "./notification.service";
const getAllNotifications = catchAsync(async (req, res) => {
    const userId = req.user.userId;
    const result = await NotificationService.getAllNotifications(userId, req.query);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Notifications retrieved successfully.",
        meta: result.meta,
        data: result.data,
    });
});
const getNotificationById = catchAsync(async (req, res) => {
    const userId = req.user.userId;
    const id = req.params.id;
    const result = await NotificationService.getNotificationById(userId, id);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Notification retrieved successfully.",
        data: result,
    });
});
const getUnreadCount = catchAsync(async (req, res) => {
    const userId = req.user.userId;
    const result = await NotificationService.getUnreadCount(userId);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Unread notification count retrieved successfully.",
        data: result,
    });
});
const markAsRead = catchAsync(async (req, res) => {
    const userId = req.user.userId;
    const id = req.params.id;
    const result = await NotificationService.markAsRead(userId, id);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Notification marked as read successfully.",
        data: result,
    });
});
const markAllAsRead = catchAsync(async (req, res) => {
    const userId = req.user.userId;
    const result = await NotificationService.markAllAsRead(userId);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "All notifications marked as read successfully.",
        data: result,
    });
});
const deleteNotification = catchAsync(async (req, res) => {
    const userId = req.user.userId;
    const id = req.params.id;
    const result = await NotificationService.deleteNotification(userId, id);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Notification deleted successfully.",
        data: result,
    });
});
export const NotificationController = {
    getAllNotifications,
    getNotificationById,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
