import httpStatus from "http-status";
import { User, UserStatus, Warehouse, WarehouseStatus } from "../../../generated/prisma/index.js";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
    userFilterableFields,
    userSearchableFields,
} from "../user/user.constant";
import {
    warehouseFilterableFields,
    warehouseSearchableFields,
} from "./warehouse.constant";
import {
    ICreateWarehouse,
    IUpdateWarehouse,
    IUpdateWarehouseStatus,
} from "./warehouse.interface";

const createWarehouse = async (payload: ICreateWarehouse) => {
    const existingWarehouse = await prisma.warehouse.findUnique({
        where: { code: payload.code },
    });

    if (existingWarehouse) {
        throw new AppError(
            httpStatus.CONFLICT,
            "Warehouse code already exists.",
        );
    }

    const result = await prisma.warehouse.create({
        data: payload,
    });

    return result;
};

const getAllWarehouses = async (query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder<Warehouse>(
        prisma.warehouse,
        query as IQueryParams,
        {
            searchableFields: warehouseSearchableFields,
            filterableFields: warehouseFilterableFields,
        },
    )
        .search()
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await queryBuilder.execute();

    return result;
};

const getWarehouseById = async (id: string) => {
    const warehouse = await prisma.warehouse.findUnique({
        where: { id },
    });

    if (!warehouse) {
        throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found.");
    }

    return warehouse;
};

const updateWarehouse = async (id: string, payload: IUpdateWarehouse) => {
    const existingWarehouse = await prisma.warehouse.findUnique({
        where: { id },
    });

    if (!existingWarehouse) {
        throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found.");
    }

    const updatedWarehouse = await prisma.warehouse.update({
        where: { id },
        data: payload,
    });

    return updatedWarehouse;
};

const updateWarehouseStatus = async (
    id: string,
    payload: IUpdateWarehouseStatus,
) => {
    const existingWarehouse = await prisma.warehouse.findUnique({
        where: { id },
    });

    if (!existingWarehouse) {
        throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found.");
    }

    const updatedWarehouse = await prisma.warehouse.update({
        where: { id },
        data: {
            status: payload.status,
        },
    });

    return updatedWarehouse;
};

const assignUserToWarehouse = async (
    warehouseId: string,
    userId: string,
) => {
    const warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId },
    });

    if (!warehouse) {
        throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found.");
    }

    if (warehouse.status !== WarehouseStatus.ACTIVE) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot assign user to an inactive warehouse.",
        );
    }

    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            isDeleted: false,
        },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found.");
    }

    if (user.status !== UserStatus.ACTIVE) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "User account is not active.",
        );
    }

    if (user.warehouseId) {
        throw new AppError(
            httpStatus.CONFLICT,
            "User is already assigned to another warehouse.",
        );
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            warehouseId,
        },
    });

    return updatedUser;
};

const unassignUserFromWarehouse = async (
    warehouseId: string,
    userId: string,
) => {
    const warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId },
    });

    if (!warehouse) {
        throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found.");
    }

    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            isDeleted: false,
        },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found.");
    }

    if (user.warehouseId !== warehouseId) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "User is not assigned to this warehouse.",
        );
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            warehouseId: null,
        },
    });

    return updatedUser;
};

const getWarehouseUsers = async (
    warehouseId: string,
    query: Record<string, unknown>,
) => {
    const warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId },
    });

    if (!warehouse) {
        throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found.");
    }

    const queryBuilder = new QueryBuilder<User>(
        prisma.user,
        query as IQueryParams,
        {
            searchableFields: userSearchableFields,
            filterableFields: userFilterableFields,
        },
    )
        .where({ warehouseId, isDeleted: false })
        .search()
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await queryBuilder.execute();

    return result;
};

export const WarehouseService = {
    createWarehouse,
    getAllWarehouses,
    getWarehouseById,
    updateWarehouse,
    updateWarehouseStatus,
    assignUserToWarehouse,
    unassignUserFromWarehouse,
    getWarehouseUsers,
};
