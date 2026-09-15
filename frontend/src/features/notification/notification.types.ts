import { QueryParams } from "@/lib/api/api-client";

export type NotificationType =
  | "INFO"
  | "SUCCESS"
  | "WARNING"
  | "ERROR"
  | "SYSTEM";

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationQueryParams extends QueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  isRead?: boolean | string;
  type?: NotificationType;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  entityType?: string;
  entityId?: string;
}

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface NotificationListResponse {
  success: boolean;
  message: string;
  meta: ApiMeta;
  data: INotification[];
}

export interface NotificationDetailResponse {
  success: boolean;
  message: string;
  data: INotification;
}

export interface UnreadCountResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
  };
}

export interface MarkAllReadResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
  };
}

export interface ServerToClientEvents {
  "notification:new": (notification: INotification) => void;
}

export interface ClientToServerEvents {
  [event: string]: (...args: unknown[]) => void;
}
