import status from "http-status";
import { fromNodeHeaders } from "better-auth/node";
import { UserStatus } from "../../generated/prisma/enums";
import AppError from "../errorHelpers/AppError";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
export const checkAuth = (...authRoles) => async (req, _res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });
        if (!session) {
            throw new AppError(status.UNAUTHORIZED, "Authentication required.");
        }
        const user = session.user;
        if (user.status === UserStatus.BLOCKED ||
            user.status === UserStatus.DELETED ||
            user.isDeleted) {
            throw new AppError(status.UNAUTHORIZED, "User account is not active.");
        }
        if (authRoles.length > 0 &&
            !authRoles.includes(user.role)) {
            throw new AppError(status.FORBIDDEN, "You do not have permission to access this resource.");
        }
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { warehouseId: true },
        });
        req.user = {
            userId: user.id,
            role: user.role,
            email: user.email,
            warehouseId: dbUser?.warehouseId ?? null,
        };
        next();
    }
    catch (error) {
        next(error);
    }
};
