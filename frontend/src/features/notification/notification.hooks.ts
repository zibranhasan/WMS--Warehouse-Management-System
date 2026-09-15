import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { useCurrentUser } from "../auth/auth.hooks";
import { notificationApi } from "./notification.api";
import {
  INotification,
  NotificationListResponse,
  NotificationQueryParams,
  UnreadCountResponse,
} from "./notification.types";
import { useNotificationSubscription } from "./hooks/use-notification-socket";

export const notificationKeys = {
  all: (userId?: string) =>
    userId ? (["notifications", userId] as const) : (["notifications"] as const),
  lists: (userId?: string) =>
    [...notificationKeys.all(userId), "list"] as const,
  list: (userId?: string, params?: NotificationQueryParams) =>
    [...notificationKeys.lists(userId), params] as const,
  details: (userId?: string) =>
    [...notificationKeys.all(userId), "detail"] as const,
  detail: (userId?: string, id?: string) =>
    [...notificationKeys.details(userId), id] as const,
  unreadCount: (userId?: string) =>
    [...notificationKeys.all(userId), "unread-count"] as const,
};

/**
 * Hook to clean up the previous user's notification cache when the authenticated user changes.
 */
export function useNotificationCacheCleanup() {
  const queryClient = useQueryClient();
  const { data: meData } = useCurrentUser();
  const currentUserId = meData?.data?.user?.id;
  const prevUserIdRef = useRef<string | undefined>(currentUserId);

  useEffect(() => {
    const prevUserId = prevUserIdRef.current;
    if (prevUserId && prevUserId !== currentUserId) {
      queryClient.removeQueries({
        queryKey: notificationKeys.all(prevUserId),
      });
    }
    prevUserIdRef.current = currentUserId;
  }, [currentUserId, queryClient]);
}

export function useNotifications(params?: NotificationQueryParams) {
  const { data: meData } = useCurrentUser();
  const userId = meData?.data?.user?.id;

  return useQuery({
    queryKey: notificationKeys.list(userId, params),
    queryFn: () => notificationApi.getNotifications(params),
    enabled: Boolean(userId),
  });
}

export function useNotification(id: string) {
  const { data: meData } = useCurrentUser();
  const userId = meData?.data?.user?.id;

  return useQuery({
    queryKey: notificationKeys.detail(userId, id),
    queryFn: () => notificationApi.getNotificationById(id),
    enabled: Boolean(userId && id),
  });
}

export function useUnreadNotificationCount() {
  const { data: meData } = useCurrentUser();
  const userId = meData?.data?.user?.id;

  return useQuery({
    queryKey: notificationKeys.unreadCount(userId),
    queryFn: notificationApi.getUnreadCount,
    enabled: Boolean(userId),
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const { data: meData } = useCurrentUser();
  const userId = meData?.data?.user?.id;

  return useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: (response, id) => {
      if (!userId) return;

      // Optimistically update list queries in cache for current user
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: notificationKeys.lists(userId) },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((item) =>
              item.id === id
                ? { ...item, isRead: true, readAt: new Date().toISOString() }
                : item
            ),
          };
        }
      );

      // Decrement unread count for current user
      queryClient.setQueryData<UnreadCountResponse>(
        notificationKeys.unreadCount(userId),
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: {
              count: Math.max(0, oldData.data.count - 1),
            },
          };
        }
      );

      queryClient.invalidateQueries({ queryKey: notificationKeys.all(userId) });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  const { data: meData } = useCurrentUser();
  const userId = meData?.data?.user?.id;

  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      if (!userId) return;

      // Mark all items as read in cache for current user
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: notificationKeys.lists(userId) },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((item) => ({
              ...item,
              isRead: true,
              readAt: item.readAt || new Date().toISOString(),
            })),
          };
        }
      );

      // Reset unread count to 0 for current user
      queryClient.setQueryData<UnreadCountResponse>(
        notificationKeys.unreadCount(userId),
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: { count: 0 },
          };
        }
      );

      queryClient.invalidateQueries({ queryKey: notificationKeys.all(userId) });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { data: meData } = useCurrentUser();
  const userId = meData?.data?.user?.id;

  return useMutation({
    mutationFn: (id: string) => notificationApi.deleteNotification(id),
    onSuccess: (_data, id) => {
      if (!userId) return;
      let wasUnread = false;

      // Remove from list queries in cache for current user
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: notificationKeys.lists(userId) },
        (oldData) => {
          if (!oldData) return oldData;
          const target = oldData.data.find((item) => item.id === id);
          if (target && !target.isRead) {
            wasUnread = true;
          }
          return {
            ...oldData,
            meta: {
              ...oldData.meta,
              total: Math.max(0, oldData.meta.total - 1),
            },
            data: oldData.data.filter((item) => item.id !== id),
          };
        }
      );

      // Decrement unread count if deleted notification was unread for current user
      if (wasUnread) {
        queryClient.setQueryData<UnreadCountResponse>(
          notificationKeys.unreadCount(userId),
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              data: {
                count: Math.max(0, oldData.data.count - 1),
              },
            };
          }
        );
      }

      queryClient.invalidateQueries({ queryKey: notificationKeys.all(userId) });
    },
  });
}

/**
 * Real-time hook connecting Socket.IO `notification:new` events to React Query cache.
 * Scoped to the currently authenticated user with defense-in-depth recipient validation.
 */
export function useNotificationRealtime() {
  const queryClient = useQueryClient();
  const { data: meData } = useCurrentUser();
  const currentUserId = meData?.data?.user?.id;

  // Clean up previous user's notification cache on auth change
  useNotificationCacheCleanup();

  const handleNewNotification = useCallback(
    (newNotification: INotification) => {
      // Defense-in-depth: only process event if targeted at currently authenticated user
      if (!currentUserId || newNotification.userId !== currentUserId) {
        return;
      }

      // Track whether the notification was actually inserted (not a duplicate)
      let wasInserted = false;

      // 1. Update notification list queries with deduplication by ID for current user
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: notificationKeys.lists(currentUserId) },
        (oldData) => {
          if (!oldData) return oldData;

          // Deduplicate by ID
          const exists = oldData.data.some(
            (item) => item.id === newNotification.id
          );
          if (exists) return oldData;

          wasInserted = true;
          return {
            ...oldData,
            meta: {
              ...oldData.meta,
              total: oldData.meta.total + 1,
            },
            data: [newNotification, ...oldData.data],
          };
        }
      );

      // 2. Only increment unread count and invalidate if the notification was new
      if (wasInserted) {
        queryClient.setQueryData<UnreadCountResponse>(
          notificationKeys.unreadCount(currentUserId),
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              data: {
                count: oldData.data.count + 1,
              },
            };
          }
        );

        queryClient.invalidateQueries({
          queryKey: notificationKeys.lists(currentUserId),
          exact: false,
        });
        queryClient.invalidateQueries({
          queryKey: notificationKeys.unreadCount(currentUserId),
        });
      }
    },
    [queryClient, currentUserId]
  );

  return useNotificationSubscription(handleNewNotification);
}
