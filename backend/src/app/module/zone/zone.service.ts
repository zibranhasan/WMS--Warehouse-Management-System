import httpStatus from "http-status";
import { LocationStatus, WarehouseStatus, Zone } from "../../../generated/prisma/index.js";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { zoneFilterableFields, zoneSearchableFields } from "./zone.constant";
import {
    ICreateZone,
    IUpdateZone,
    IUpdateZoneStatus,
} from "./zone.interface";

const createZone = async (payload: ICreateZone) => {
    // 1. Validate warehouse exists and is ACTIVE
    const warehouse = await prisma.warehouse.findUnique({
        where: { id: payload.warehouseId },
    });

    if (!warehouse) {
        throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found.");
    }

    if (warehouse.status !== WarehouseStatus.ACTIVE) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot create Zone: Warehouse is inactive.",
        );
    }

    // 2. Validate capacity
    if (payload.capacity !== undefined && payload.capacity < 0) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Capacity must be greater than or equal to 0.",
        );
    }

    // 3. Check for duplicate code within the warehouse
    const existingZone = await prisma.zone.findFirst({
        where: {
            warehouseId: payload.warehouseId,
            code: payload.code,
            isDeleted: false,
        },
    });

    if (existingZone) {
        throw new AppError(
            httpStatus.CONFLICT,
            `Zone code '${payload.code}' already exists in this warehouse.`,
        );
    }

    const result = await prisma.zone.create({
        data: {
            warehouseId: payload.warehouseId,
            code: payload.code,
            name: payload.name,
            description: payload.description,
            capacity: payload.capacity ?? 0,
        },
        include: {
            warehouse: true,
        },
    });

    return result;
};

const getAllZones = async (
    query: Record<string, unknown>,
    warehouseScope?: string | null,
) => {
    const filterQuery: Record<string, unknown> = { isDeleted: "false", ...query };

    // Enforce authenticated warehouse scope (prevents client ?warehouseId= override)
    if (warehouseScope) {
        filterQuery.warehouseId = warehouseScope;
    }

    const queryBuilder = new QueryBuilder<Zone>(
        prisma.zone,
        filterQuery as unknown as IQueryParams,
        {
            searchableFields: zoneSearchableFields,
            filterableFields: zoneFilterableFields,
        },
    )
        .search()
        .filter()
        .sort()
        .paginate()
        .fields()
        .include({ warehouse: true });

    if (warehouseScope) {
        queryBuilder.where({ warehouseId: warehouseScope } as never);
    }

    const result = await queryBuilder.execute();
    return result;
};

const getZoneById = async (id: string) => {
    const zone = await prisma.zone.findFirst({
        where: { id, isDeleted: false },
        include: {
            warehouse: true,
            aisles: {
                where: { isDeleted: false },
            },
        },
    });

    if (!zone) {
        throw new AppError(httpStatus.NOT_FOUND, "Zone not found.");
    }

    return zone;
};

const getZoneAisles = async (id: string) => {
    const zone = await prisma.zone.findFirst({
        where: { id, isDeleted: false },
    });

    if (!zone) {
        throw new AppError(httpStatus.NOT_FOUND, "Zone not found.");
    }

    const aisles = await prisma.aisle.findMany({
        where: { zoneId: id, isDeleted: false },
        include: {
            shelves: {
                where: { isDeleted: false },
            },
        },
    });

    return aisles;
};

const updateZone = async (id: string, payload: IUpdateZone) => {
    const existingZone = await prisma.zone.findFirst({
        where: { id, isDeleted: false },
    });

    if (!existingZone) {
        throw new AppError(httpStatus.NOT_FOUND, "Zone not found.");
    }

    const targetWarehouseId = payload.warehouseId ?? existingZone.warehouseId;
    const targetCode = payload.code ?? existingZone.code;

    // If changing warehouse, validate new warehouse & ensure no active children
    if (payload.warehouseId && payload.warehouseId !== existingZone.warehouseId) {
        const warehouse = await prisma.warehouse.findUnique({
            where: { id: payload.warehouseId },
        });

        if (!warehouse) {
            throw new AppError(httpStatus.NOT_FOUND, "Target warehouse not found.");
        }

        if (warehouse.status !== WarehouseStatus.ACTIVE) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Cannot move Zone: Target warehouse is inactive.",
            );
        }

        const activeAisleCount = await prisma.aisle.count({
            where: { zoneId: id, isDeleted: false },
        });

        if (activeAisleCount > 0) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Cannot move Zone to another warehouse while active aisles exist under it.",
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

    // Check code uniqueness in target warehouse if code or warehouseId updated
    if (payload.code || payload.warehouseId) {
        const duplicateZone = await prisma.zone.findFirst({
            where: {
                warehouseId: targetWarehouseId,
                code: targetCode,
                isDeleted: false,
                NOT: { id },
            },
        });

        if (duplicateZone) {
            throw new AppError(
                httpStatus.CONFLICT,
                `Zone code '${targetCode}' already exists in target warehouse.`,
            );
        }
    }

    const updatedZone = await prisma.zone.update({
        where: { id },
        data: payload,
        include: {
            warehouse: true,
        },
    });

    return updatedZone;
};

const updateZoneStatus = async (id: string, payload: IUpdateZoneStatus) => {
    const existingZone = await prisma.zone.findFirst({
        where: { id, isDeleted: false },
    });

    if (!existingZone) {
        throw new AppError(httpStatus.NOT_FOUND, "Zone not found.");
    }

    const updatedZone = await prisma.zone.update({
        where: { id },
        data: { status: payload.status },
        include: {
            warehouse: true,
        },
    });

    return updatedZone;
};

const deleteZone = async (id: string) => {
    const existingZone = await prisma.zone.findFirst({
        where: { id, isDeleted: false },
    });

    if (!existingZone) {
        throw new AppError(httpStatus.NOT_FOUND, "Zone not found.");
    }

    // Check if active aisles exist
    const activeAisleCount = await prisma.aisle.count({
        where: { zoneId: id, isDeleted: false },
    });

    if (activeAisleCount > 0) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot delete zone while active aisles exist.",
        );
    }

    const deletedZone = await prisma.zone.update({
        where: { id },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
        },
    });

    return deletedZone;
};

export const ZoneService = {
    createZone,
    getAllZones,
    getZoneById,
    getZoneAisles,
    updateZone,
    updateZoneStatus,
    deleteZone,
};
