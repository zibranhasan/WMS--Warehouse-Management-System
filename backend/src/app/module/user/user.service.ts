import httpStatus from "http-status";
import { User, UserStatus } from "../../../generated/prisma/index.js";
import { deleteFileFromCloudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
    userFilterableFields,
    userSearchableFields,
} from "./user.constant";
import {
    IAssignRole,
    IAssignWarehouse,
    ICreateUser,
    IUpdateUser,
} from "./user.interface";

const createUser = async (payload: ICreateUser, file?: Express.Multer.File) => {
    const { name, email, password, role } = payload;

    // Check if user already exists in the system
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new AppError(
            httpStatus.CONFLICT,
            "User with this email already exists.",
        );
    }

    // Better Auth handles secure user creation & password hashing
    const authData = await auth.api.signUpEmail({
        body: {
            name,
            email,
            password,
        },
    });

    if (!authData?.user) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Failed to create user with authentication provider.",
        );
    }

    try {
        // Update application-owned attributes
        const updatedUser = await prisma.user.update({
            where: {
                id: authData.user.id,
            },
            data: {
                role,
                status: UserStatus.ACTIVE,
                needPasswordChange: true,
                isDeleted: false,
                deletedAt: null,
                ...(file?.path && { image: file.path }),
            },
        });

        return updatedUser;
    } catch (error) {
        // Cleanup created user if subsequent Prisma operation fails
        await prisma.user
            .delete({
                where: { id: authData.user.id },
            })
            .catch(() => {});
        throw error;
    }
};

const getAllUsers = async (query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder<User>(
        prisma.user,
        query as IQueryParams,
        {
            searchableFields: userSearchableFields,
            filterableFields: userFilterableFields,
        },
    )
        .where({ isDeleted: false })
        .search()
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await queryBuilder.execute();

    return result;
};

const getUserById = async (id: string) => {
    const user = await prisma.user.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found.");
    }

    return user;
};

const updateUser = async (
    id: string,
    payload: IUpdateUser,
    file?: Express.Multer.File,
) => {
    const existingUser = await prisma.user.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!existingUser) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found.");
    }

    const oldImage = existingUser.image;

    const updatedUser = await prisma.user.update({
        where: { id },
        data: {
            ...payload,
            ...(file?.path && { image: file.path }),
        },
    });

    // Delete old Cloudinary image only AFTER successful database update
    if (file?.path && oldImage) {
        await deleteFileFromCloudinary(oldImage).catch((err) => {
            console.error("Error deleting old file from Cloudinary:", err);
        });
    }

    return updatedUser;
};

const blockUser = async (id: string) => {
    const existingUser = await prisma.user.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!existingUser) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found.");
    }

    if (existingUser.status === UserStatus.BLOCKED) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is already blocked.");
    }

    const updatedUser = await prisma.user.update({
        where: { id },
        data: {
            status: UserStatus.BLOCKED,
        },
    });

    return updatedUser;
};

const unblockUser = async (id: string) => {
    const existingUser = await prisma.user.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!existingUser) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found.");
    }

    if (existingUser.status === UserStatus.ACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is already active.");
    }

    const updatedUser = await prisma.user.update({
        where: { id },
        data: {
            status: UserStatus.ACTIVE,
        },
    });

    return updatedUser;
};

const assignRole = async (id: string, payload: IAssignRole) => {
    const existingUser = await prisma.user.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!existingUser) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found.");
    }

    const updatedUser = await prisma.user.update({
        where: { id },
        data: {
            role: payload.role,
        },
    });

    return updatedUser;
};

const assignWarehouse = async (id: string, payload: IAssignWarehouse) => {
    const existingUser = await prisma.user.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!existingUser) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found.");
    }

    // Stub service logic prepared for future Warehouse model relation integration
    return {
        user: existingUser,
        warehouseId: payload.warehouseId,
        message: "Warehouse assignment prepared for future model relation.",
    };
};

const deleteUser = async (id: string) => {
    const existingUser = await prisma.user.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!existingUser) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            "User not found or already deleted.",
        );
    }

    const softDeletedUser = await prisma.user.update({
        where: { id },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
            status: UserStatus.DELETED,
        },
    });

    return softDeletedUser;
};

export const UserService = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    blockUser,
    unblockUser,
    assignRole,
    assignWarehouse,
    deleteUser,
};
