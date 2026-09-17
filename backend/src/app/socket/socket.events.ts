import { Notification } from "../../generated/prisma/index.js";
import { getIO } from "./index.js";

/**
 * Emits a newly created notification in real-time to the recipient user's private room.
 * Safely catches and logs errors (e.g. if Socket.IO is not initialized or emission fails)
 * without throwing, ensuring database persistence is never compromised.
 */
export const emitNotificationCreated = (notification: Notification): void => {
    try {
        const io = getIO();
        io.to(`user:${notification.userId}`).emit(
            "notification:new",
            notification,
        );
    } catch (error) {
        console.error(
            `[Socket.IO] Failed to emit notification:new to user:${notification.userId}:`,
            error instanceof Error ? error.message : error,
        );
    }
};
