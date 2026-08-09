import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { fromNodeHeaders } from "better-auth/node";

import { Role, UserStatus } from "../../generated/prisma/enums";
import AppError from "../errorHelpers/AppError";
import { auth } from "../lib/auth";

export const checkAuth =
    (...authRoles: Role[]) =>
        async (
            req: Request,
            _res: Response,
            next: NextFunction,
        ) => {
            try {
                const session = await auth.api.getSession({
                    headers: fromNodeHeaders(req.headers),
                });

                if (!session) {
                    throw new AppError(
                        status.UNAUTHORIZED,
                        "Authentication required.",
                    );
                }

                const user = session.user;

                if (
                    user.status === UserStatus.BLOCKED ||
                    user.status === UserStatus.DELETED ||
                    user.isDeleted
                ) {
                    throw new AppError(
                        status.UNAUTHORIZED,
                        "User account is not active.",
                    );
                }

                if (
                    authRoles.length > 0 &&
                    !authRoles.includes(user.role as Role)
                ) {
                    throw new AppError(
                        status.FORBIDDEN,
                        "You do not have permission to access this resource.",
                    );
                }

                req.user = {
                    userId: user.id,
                    role: user.role as Role,
                    email: user.email,
                };

                next();
            } catch (error) {
                next(error);
            }
        };