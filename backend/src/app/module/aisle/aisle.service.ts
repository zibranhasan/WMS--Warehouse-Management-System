import httpStatus from "http-status";
import { Aisle, LocationStatus } from "../../../generated/prisma/index.js";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { aisleFilterableFields, aisleSearchableFields } from "./aisle.constant";
import {
    ICreateAisle,
    IUpdateAisle,
    IUpdateAisleStatus,
} from "./aisle.interface";

const createAisle = async (payload: ICreateAisle) => {
    // 1. Validate parent zone exists, is active, and is not deleted
    const zone = await prisma.zone.findFirst({
        where: { id: payload.zoneId, isDeleted: false },
    });

    if (!zone) {
        throw new AppError(httpStatus.NOT_FOUND, "Zone not found.");
    }

    if (zone.status !== LocationStatus.ACTIVE) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot create Aisle: Parent Zone is inactive.",
        );
    }

    // 2. Validate capacity
    if (payload.capacity !== undefined && payload.capacity < 0) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Capacity must be greater than or equal to 0.",
        );
    }

    // 3. Check for duplicate code within the zone
    const existingAisle = await prisma.aisle.findFirst({
        where: {
            zoneId: payload.zoneId,
            code: payload.code,
            isDeleted: false,
        },
    });

    if (existingAisle) {
        throw new AppError(
            httpStatus.CONFLICT,
            `Aisle code '${payload.code}' already exists in this zone.`,
        );
    }

    const result = await prisma.aisle.create({
        data: {
            zoneId: payload.zoneId,
            code: payload.code,
            name: payload.name,
            description: payload.description,
            capacity: payload.capacity ?? 0,
        },
        include: {
            zone: true,
        },
    });

    return result;
};

const getAllAisles = async (
    query: Record<string, unknown>,
    warehouseScope?: string | null,
) => {
    const filterQuery: Record<string, unknown> = { isDeleted: "false", ...query };

    if (warehouseScope) {
        // Enforce authenticated warehouse scope (prevents client ?warehouseId= override)
        filterQuery["zone.warehouseId"] = warehouseScope;
        delete filterQuery.warehouseId;
    } else if (filterQuery.warehouseId) {
        filterQuery["zone.warehouseId"] = filterQuery.warehouseId;
        delete filterQuery.warehouseId;
    }

    const queryBuilder = new QueryBuilder<Aisle>(
        prisma.aisle,
        filterQuery as unknown as IQueryParams,
        {
            searchableFields: aisleSearchableFields,
            filterableFields: aisleFilterableFields,
        },
    )
        .search()
        .filter()
        .sort()
        .paginate()
        .fields()
        .include({ zone: { include: { warehouse: true } } });

    if (warehouseScope) {
        queryBuilder.where({
            zone: {
                warehouseId: warehouseScope,
            },
        } as never);
    }

    const result = await queryBuilder.execute();
    return result;
};

const getAisleById = async (id: string) => {
    const aisle = await prisma.aisle.findFirst({
        where: { id, isDeleted: false },
        include: {
            zone: true,
            shelves: {
                where: { isDeleted: false },
            },
        },
    });

    if (!aisle) {
        throw new AppError(httpStatus.NOT_FOUND, "Aisle not found.");
    }

    return aisle;
};

const getAisleShelves = async (id: string) => {
    const aisle = await prisma.aisle.findFirst({
        where: { id, isDeleted: false },
    });

    if (!aisle) {
        throw new AppError(httpStatus.NOT_FOUND, "Aisle not found.");
    }

    const shelves = await prisma.shelf.findMany({
        where: { aisleId: id, isDeleted: false },
        include: {
            bins: {
                where: { isDeleted: false },
            },
        },
    });

    return shelves;
};

const updateAisle = async (id: string, payload: IUpdateAisle) => {
    const existingAisle = await prisma.aisle.findFirst({
        where: { id, isDeleted: false },
    });

    if (!existingAisle) {
        throw new AppError(httpStatus.NOT_FOUND, "Aisle not found.");
    }

    const targetZoneId = payload.zoneId ?? existingAisle.zoneId;
    const targetCode = payload.code ?? existingAisle.code;

    // If changing zone, validate new zone & ensure no active child shelves
    if (payload.zoneId && payload.zoneId !== existingAisle.zoneId) {
        const zone = await prisma.zone.findFirst({
            where: { id: payload.zoneId, isDeleted: false },
        });

        if (!zone) {
            throw new AppError(httpStatus.NOT_FOUND, "Target zone not found.");
        }

        if (zone.status !== LocationStatus.ACTIVE) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Cannot move Aisle: Target zone is inactive.",
            );
        }

        const activeShelfCount = await prisma.shelf.count({
            where: { aisleId: id, isDeleted: false },
        });

        if (activeShelfCount > 0) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Cannot move Aisle to another zone while active shelves exist under it.",
            );
        }
    }

    // Check capacity if provided
    if (payload.capacity !== undefined && payload.capacity < 0) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Capacity must be greater than or equal to 0.",
        );
    }

    // Check code uniqueness in target zone
    if (payload.code || payload.zoneId) {
        const duplicateAisle = await prisma.aisle.findFirst({
            where: {
                zoneId: targetZoneId,
                code: targetCode,
                isDeleted: false,
                NOT: { id },
            },
        });

        if (duplicateAisle) {
            throw new AppError(
                httpStatus.CONFLICT,
                `Aisle code '${targetCode}' already exists in target zone.`,
            );
        }
    }

    const updatedAisle = await prisma.aisle.update({
        where: { id },
        data: payload,
        include: {
            zone: true,
        },
    });

    return updatedAisle;
};

const updateAisleStatus = async (id: string, payload: IUpdateAisleStatus) => {
    const existingAisle = await prisma.aisle.findFirst({
        where: { id, isDeleted: false },
    });

    if (!existingAisle) {
        throw new AppError(httpStatus.NOT_FOUND, "Aisle not found.");
    }

    const updatedAisle = await prisma.aisle.update({
        where: { id },
        data: { status: payload.status },
        include: {
            zone: true,
        },
    });

    return updatedAisle;
};

const deleteAisle = async (id: string) => {
    const existingAisle = await prisma.aisle.findFirst({
        where: { id, isDeleted: false },
    });

    if (!existingAisle) {
        throw new AppError(httpStatus.NOT_FOUND, "Aisle not found.");
    }

    // Check active shelves
    const activeShelfCount = await prisma.shelf.count({
        where: { aisleId: id, isDeleted: false },
    });

    if (activeShelfCount > 0) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot delete aisle while active shelves exist.",
        );
    }

    const deletedAisle = await prisma.aisle.update({
        where: { id },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
        },
    });

    return deletedAisle;
};

export const AisleService = {
    createAisle,
    getAllAisles,
    getAisleById,
    getAisleShelves,
    updateAisle,
    updateAisleStatus,
    deleteAisle,
};
