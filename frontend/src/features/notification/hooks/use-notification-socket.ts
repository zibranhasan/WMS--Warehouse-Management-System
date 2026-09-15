"use client";

import { useEffect } from "react";
import { useSocket } from "@/providers/socket-provider";
import { INotification } from "../notification.types";

/**
 * Reusable hook to subscribe to real-time `notification:new` events.
 * Automatically registers the listener on mount and cleans up on unmount.
 */
export function useNotificationSubscription(
  onNotificationReceived: (notification: INotification) => void
) {
  const { onNotification, isConnected, connectionState } = useSocket();

  useEffect(() => {
    const unsubscribe = onNotification(onNotificationReceived);
    return () => {
      unsubscribe();
    };
  }, [onNotification, onNotificationReceived]);

  return { isConnected, connectionState };
}
