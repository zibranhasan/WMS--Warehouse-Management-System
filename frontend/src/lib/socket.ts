import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/features/notification/notification.types";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Derives the Socket.IO server origin URL from the frontend environment config.
 * Strips `/api/v1` path if pointing to REST endpoint base URL.
 */
export const getSocketOrigin = (): string => {
  const apiUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000";
  try {
    const url = new URL(apiUrl);
    return url.origin;
  } catch {
    return apiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");
  }
};

let socketInstance: AppSocket | null = null;

/**
 * Returns the singleton Socket.IO client instance configured with credentials and auto-reconnection.
 * Returns null during SSR / server-side rendering.
 */
export const getSocket = (): AppSocket | null => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!socketInstance) {
    socketInstance = io(getSocketOrigin(), {
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ["websocket", "polling"],
    });
  }

  return socketInstance;
};
