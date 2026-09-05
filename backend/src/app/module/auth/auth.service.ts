import { Request } from "express";
import status from "http-status";
import { fromNodeHeaders } from "better-auth/node";

import { UserStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

const loginUser = async (req: Request) => {
    const { email, password } = req.body;

    const result = await auth.api.signInEmail({
        body: {
            email,
            password,
        },
        headers: fromNodeHeaders(req.headers),

        // IMPORTANT
        returnHeaders: true,
    });

    const { headers, response: data } = result;

    if (!data.user) {
        throw new AppError(
            status.UNAUTHORIZED,
            "Invalid email or password.",
        );
    }

    if (data.user.status === UserStatus.BLOCKED) {
        throw new AppError(
            status.FORBIDDEN,
            "User is blocked.",
        );
    }

    if (
        data.user.status === UserStatus.DELETED ||
        data.user.isDeleted
    ) {
        throw new AppError(
            status.NOT_FOUND,
            "User is deleted.",
        );
    }

    return {
        data,
        headers,
    };
};

const logoutUser = async (req: Request) => {
    const result = await auth.api.signOut({
        headers: fromNodeHeaders(req.headers),
        returnHeaders: true,
    });

    return result;
};

const getMe = async (req: Request) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
        throw new AppError(
            status.UNAUTHORIZED,
            "Authentication required.",
        );
    }

    const user = await prisma.user.findUnique({
        where: {
            id: session.user.id,
        },
        select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            image: true,
            role: true,
            status: true,
            needPasswordChange: true,
            isDeleted: true,
            deletedAt: true,
            createdAt: true,
            updatedAt: true,
            warehouseId: true,
            warehouse: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                },
            },
        },
    });

    if (!user) {
        throw new AppError(
            status.NOT_FOUND,
            "User not found.",
        );
    }

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

    return {
        user,
        session: {
            id: session.session.id,
            expiresAt: session.session.expiresAt,
            createdAt: session.session.createdAt,
            updatedAt: session.session.updatedAt,
        },
    };
};

const forgetPassword = async (payload: { email: string }) => {
    const { email } = payload;

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (user) {
        if (user.status === UserStatus.BLOCKED) {
            throw new AppError(status.FORBIDDEN, "User is blocked.");
        }

        if (user.status === UserStatus.DELETED || user.isDeleted) {
            throw new AppError(status.NOT_FOUND, "User is deleted.");
        }

        await auth.api.requestPasswordResetEmailOTP({
            body: {
                email,
            },
        });
    }

    return {
        message: "If an account exists for this email, a password reset OTP has been sent.",
    };
};

const resetPassword = async (payload: {
    email: string;
    otp: string;
    newPassword: string;
}) => {
    const { email, otp, newPassword } = payload;

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found.");
    }

    if (user.status === UserStatus.BLOCKED) {
        throw new AppError(status.FORBIDDEN, "User is blocked.");
    }

    if (user.status === UserStatus.DELETED || user.isDeleted) {
        throw new AppError(status.NOT_FOUND, "User is deleted.");
    }

    try {
        await auth.api.resetPasswordEmailOTP({
            body: {
                email,
                otp,
                password: newPassword,
            },
        });
    } catch (error: any) {
        throw new AppError(
            status.BAD_REQUEST,
            error?.message || "Invalid or expired OTP.",
        );
    }

    if (user.needPasswordChange) {
        await prisma.user.update({
            where: { id: user.id },
            data: { needPasswordChange: false },
        });
    }

    await prisma.session.deleteMany({
        where: { userId: user.id },
    });

    return {
        message: "Password reset successfully.",
    };
};

const changePassword = async (req: Request) => {
    const userId = req.user?.userId;

    if (!userId) {
        throw new AppError(status.UNAUTHORIZED, "Authentication required.");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found.");
    }

    if (user.status === UserStatus.BLOCKED) {
        throw new AppError(status.FORBIDDEN, "User is blocked.");
    }

    if (user.status === UserStatus.DELETED || user.isDeleted) {
        throw new AppError(status.NOT_FOUND, "User is deleted.");
    }

    const { currentPassword, newPassword } = req.body;

    let result;
    try {
        result = await auth.api.changePassword({
            body: {
                currentPassword,
                newPassword,
                revokeOtherSessions: true,
            },
            headers: fromNodeHeaders(req.headers),
            returnHeaders: true,
        });
    } catch (error: any) {
        throw new AppError(
            status.BAD_REQUEST,
            error?.message || "Failed to change password. Please verify your current password.",
        );
    }

    if (user.needPasswordChange) {
        await prisma.user.update({
            where: { id: user.id },
            data: { needPasswordChange: false },
        });
    }

    return {
        data: {
            message: "Password changed successfully.",
        },
        headers: result.headers,
    };
};

const sendVerificationOTP = async (payload: { email: string }) => {
    const { email } = payload;

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found.");
    }

    if (user.status === UserStatus.BLOCKED) {
        throw new AppError(status.FORBIDDEN, "User is blocked.");
    }

    if (user.status === UserStatus.DELETED || user.isDeleted) {
        throw new AppError(status.NOT_FOUND, "User is deleted.");
    }

    if (user.emailVerified) {
        return {
            message: "Email is already verified.",
        };
    }

    try {
        await auth.api.sendVerificationOTP({
            body: {
                email,
                type: "email-verification",
            },
        });
    } catch (error: any) {
        throw new AppError(
            status.BAD_REQUEST,
            error?.message || "Failed to send verification OTP.",
        );
    }

    return {
        message: "Verification OTP sent successfully.",
    };
};

const verifyEmail = async (payload: { email: string; otp: string }) => {
    const { email, otp } = payload;

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found.");
    }

    if (user.status === UserStatus.BLOCKED) {
        throw new AppError(status.FORBIDDEN, "User is blocked.");
    }

    if (user.status === UserStatus.DELETED || user.isDeleted) {
        throw new AppError(status.NOT_FOUND, "User is deleted.");
    }

    if (user.emailVerified) {
        return {
            message: "Email is already verified.",
        };
    }

    try {
        await auth.api.verifyEmailOTP({
            body: {
                email,
                otp,
            },
        });
    } catch (error: any) {
        throw new AppError(
            status.BAD_REQUEST,
            error?.message || "Invalid or expired OTP.",
        );
    }

    const updatedUser = await prisma.user.findUnique({
        where: { email },
    });

    if (!updatedUser || !updatedUser.emailVerified) {
        throw new AppError(
            status.INTERNAL_SERVER_ERROR,
            "Email verification failed.",
        );
    }

    return {
        message: "Email verified successfully.",
    };
};

export const AuthService = {
    loginUser,
    logoutUser,
    getMe,
    forgetPassword,
    resetPassword,
    changePassword,
    sendVerificationOTP,
    verifyEmail,
};