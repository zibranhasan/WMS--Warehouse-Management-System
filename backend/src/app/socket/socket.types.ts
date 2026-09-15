import { Socket } from "socket.io";
import { Notification, Role } from "../../generated/prisma/index.js";

export interface ISocketUser {
    userId: string;
    role: Role;
    email: string;
    warehouseId: string | null;
}

export interface SocketData {
    user?: ISocketUser;
}

export interface ServerToClientEvents {
    "notification:new": (notification: Notification) => void;
}

export interface ClientToServerEvents {
    [event: string]: (...args: unknown[]) => void;
}

export interface InterServerEvents {
    [event: string]: (...args: unknown[]) => void;
}

export type AuthenticatedSocket = Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
> & {
    user?: ISocketUser;
};
