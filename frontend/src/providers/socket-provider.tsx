"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { getSocket, AppSocket } from "@/lib/socket";
import { INotification } from "@/features/notification/notification.types";

export type SocketConnectionState = "connected" | "disconnected" | "connecting";

interface SocketContextValue {
  socket: AppSocket | null;
  connectionState: SocketConnectionState;
  isConnected: boolean;
  onNotification: (handler: (notification: INotification) => void) => () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { data: userResponse, isSuccess } = useCurrentUser();
  const isAuthenticated = isSuccess && !!userResponse?.data;
  const [connectionState, setConnectionState] =
    useState<SocketConnectionState>("disconnected");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const socket = getSocket();
    if (!socket) return;

    if (isAuthenticated) {
      setConnectionState("connecting");

      const onConnect = () => {
        setConnectionState("connected");
      };

      const onDisconnect = () => {
        setConnectionState("disconnected");
      };

      const onConnectError = (error: Error) => {
        setConnectionState("disconnected");
        // Log in development without leaking secrets
        if (process.env.NODE_ENV === "development") {
          console.warn("[Socket.IO] Handshake error:", error.message);
        }
      };

      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("connect_error", onConnectError);

      if (!socket.connected) {
        socket.connect();
      } else {
        setConnectionState("connected");
      }

      return () => {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("connect_error", onConnectError);
      };
    } else {
      if (socket.connected) {
        socket.disconnect();
      }
      setConnectionState("disconnected");
    }
  }, [isAuthenticated]);

  const onNotification = useCallback(
    (handler: (notification: INotification) => void) => {
      const socket = getSocket();
      if (!socket) return () => {};

      socket.on("notification:new", handler);
      return () => {
        socket.off("notification:new", handler);
      };
    },
    []
  );

  const isConnected = connectionState === "connected";

  return (
    <SocketContext.Provider
      value={{
        socket: typeof window !== "undefined" ? getSocket() : null,
        connectionState,
        isConnected,
        onNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
