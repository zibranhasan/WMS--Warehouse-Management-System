import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { NotificationController } from "./notification.controller";
const router = Router();
// Static routes before parameterized :id route
router.get("/unread-count", checkAuth(), NotificationController.getUnreadCount);
router.patch("/read-all", checkAuth(), NotificationController.markAllAsRead);
// User-scoped notification list
router.get("/", checkAuth(), NotificationController.getAllNotifications);
// Specific notification operations
router.get("/:id", checkAuth(), NotificationController.getNotificationById);
router.patch("/:id/read", checkAuth(), NotificationController.markAsRead);
router.delete("/:id", checkAuth(), NotificationController.deleteNotification);
export const NotificationRoutes = router;
