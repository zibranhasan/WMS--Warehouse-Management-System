import { Socket } from "socket.io";
import { fromNodeHeaders } from "better-auth/node";
import { Role, UserStatus } from "../../generated/prisma/index.js";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { AuthenticatedSocket, ISocketUser } from "./socket.types";

/**
 * Socket.IO handshake authentication middleware.
 * Validates the session cookie/headers using Better Auth.
 * Rejects unauthenticated connections and inactive users.
 */
export const socketAuthMiddleware = async (
    socket: Socket,
    next: (err?: Error) => void,
) => {
    try {
        const rawHeaders = socket.request.headers;
        const headers = fromNodeHeaders(rawHeaders);

        const session = await auth.api.getSession({
            headers,
        });

        if (!session || !session.user) {
            return next(new Error("Unauthorized: Authentication required."));
        }

        const user = session.user;

        if (
            user.status === UserStatus.BLOCKED ||
            user.status === UserStatus.DELETED ||
            user.isDeleted
        ) {
            return next(new Error("Unauthorized: User account is not active."));
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { warehouseId: true },
        });

        const socketUser: ISocketUser = {
            userId: user.id,
            role: user.role as Role,
            email: user.email,
            warehouseId: dbUser?.warehouseId ?? null,
        };

        socket.data = socket.data || {};
        socket.data.user = socketUser;
        (socket as AuthenticatedSocket).user = socketUser;

        next();
    } catch (error) {
        const errMessage =
            error instanceof Error ? error.message : "Authentication failed.";
        next(new Error(`Unauthorized: ${errMessage}`));
    }
};
