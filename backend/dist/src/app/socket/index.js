import { Server as SocketIOServer } from "socket.io";
import { socketServerOptions } from "./socket.config";
import { socketAuthMiddleware } from "./socket.middleware";
let io = null;
/**
 * Initializes the Socket.IO server and attaches it to the HTTP server.
 * Registers authentication middleware and connection lifecycle handlers.
 */
export const initializeSocketServer = (httpServer) => {
    io = new SocketIOServer(httpServer, socketServerOptions);
    // Enforce handshake authentication
    io.use(socketAuthMiddleware);
    io.on("connection", (rawSocket) => {
        const socket = rawSocket;
        const user = socket.data?.user || socket.user;
        const userId = user?.userId;
        if (userId) {
            // Join user-specific private room
            socket.join(`user:${userId}`);
            console.log(`[Socket.IO] Authenticated client connected: socket=${socket.id} user=${userId}`);
        }
        socket.on("disconnect", (reason) => {
            console.log(`[Socket.IO] Client disconnected: socket=${socket.id} user=${userId || "unknown"} (Reason: ${reason})`);
        });
    });
    return io;
};
/**
 * Returns the initialized Socket.IO server instance.
 * Throws an error if the server hasn't been initialized yet.
 */
export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO server has not been initialized. Call initializeSocketServer first.");
    }
    return io;
};
export * from "./socket.types";
export * from "./socket.events";
