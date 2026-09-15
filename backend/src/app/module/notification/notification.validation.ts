import { z } from "zod";
import { NotificationType } from "../../../generated/prisma/index.js";

const createNotificationValidationSchema = z.object({
    userId: z.string().min(1, "User ID is required."),
    title: z.string().min(1, "Title is required."),
    message: z.string().min(1, "Message is required."),
    type: z.nativeEnum(NotificationType).optional(),
    entityType: z.string().optional(),
    entityId: z.string().optional(),
});

export const NotificationValidation = {
    createNotificationValidationSchema,
};
