import { apiClient, QueryParams } from "@/lib/api/api-client";
import {
  ApiResponse,
  MarkAllReadResponse,
  NotificationDetailResponse,
  NotificationListResponse,
  NotificationQueryParams,
  UnreadCountResponse,
} from "./notification.types";

export const notificationApi = {
  getNotifications: async (
    params?: NotificationQueryParams
  ): Promise<NotificationListResponse> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
    }

    return apiClient.get<NotificationListResponse>("notifications", {
      params: cleanParams,
    });
  },

  getNotificationById: async (
    id: string
  ): Promise<NotificationDetailResponse> => {
    return apiClient.get<NotificationDetailResponse>(`notifications/${id}`);
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    return apiClient.get<UnreadCountResponse>("notifications/unread-count");
  },

  markAsRead: async (id: string): Promise<NotificationDetailResponse> => {
    return apiClient.patch<NotificationDetailResponse>(
      `notifications/${id}/read`
    );
  },

  markAllAsRead: async (): Promise<MarkAllReadResponse> => {
    return apiClient.patch<MarkAllReadResponse>("notifications/read-all");
  },

  deleteNotification: async (
    id: string
  ): Promise<ApiResponse<NotificationDetailResponse["data"]>> => {
    return apiClient.delete<ApiResponse<NotificationDetailResponse["data"]>>(
      `notifications/${id}`
    );
  },
};
