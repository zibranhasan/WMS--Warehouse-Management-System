import { NotificationType } from "../../../generated/prisma/index.js";

export interface ICreateNotificationPayload {
    userId: string;
    type?: NotificationType;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
}

export interface INotificationFilters {
    searchTerm?: string;
    isRead?: boolean | string;
    type?: NotificationType;
    entityType?: string;
    entityId?: string;
}
