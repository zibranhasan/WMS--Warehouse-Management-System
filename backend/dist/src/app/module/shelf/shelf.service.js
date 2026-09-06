import httpStatus from "http-status";
import { LocationStatus } from "../../../generated/prisma/index.js";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { shelfFilterableFields, shelfSearchableFields } from "./shelf.constant";
const createShelf = async (payload) => {
    // 1. Validate parent aisle exists, is active, and is not deleted
    const aisle = await prisma.aisle.findFirst({
        where: { id: payload.aisleId, isDeleted: false },
    });
    if (!aisle) {
        throw new AppError(httpStatus.NOT_FOUND, "Aisle not found.");
    }
    if (aisle.status !== LocationStatus.ACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, "Cannot create Shelf: Parent Aisle is inactive.");
    }
    // 2. Validate capacity
    if (payload.capacity !== undefined && payload.capacity < 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Capacity must be greater than or equal to 0.");
    }
    // 3. Check for duplicate code within the aisle
    const existingShelf = await prisma.shelf.findFirst({
        where: {
            aisleId: payload.aisleId,
            code: payload.code,
            isDeleted: false,
        },
    });
    if (existingShelf) {
        throw new AppError(httpStatus.CONFLICT, `Shelf code '${payload.code}' already exists in this aisle.`);
    }
    const result = await prisma.shelf.create({
        data: {
            aisleId: payload.aisleId,
            code: payload.code,
            name: payload.name,
            description: payload.description,
            capacity: payload.capacity ?? 0,
        },
        include: {
            aisle: true,
        },
    });
    return result;
};
const getAllShelves = async (query, warehouseScope) => {
    const filterQuery = { isDeleted: "false", ...query };
    // Determine authoritative warehouse ID (warehouseScope takes precedence)
    const effectiveWarehouseId = warehouseScope || filterQuery.warehouseId;
    // Remove warehouseId from filterQuery to avoid QueryBuilder creating an invalid 3-part 'some' relation
    delete filterQuery.warehouseId;
    delete filterQuery["aisle.zone.warehouseId"];
    if (filterQuery.zoneId) {
        filterQuery["aisle.zoneId"] = filterQuery.zoneId;
        delete filterQuery.zoneId;
    }
    const queryBuilder = new QueryBuilder(prisma.shelf, filterQuery, {
        searchableFields: shelfSearchableFields,
        filterableFields: shelfFilterableFields,
    })
        .search()
        .filter()
        .sort()
        .paginate()
        .fields()
        .include({ aisle: { include: { zone: { include: { warehouse: true } } } } });
    if (effectiveWarehouseId) {
        queryBuilder.where({
            aisle: {
                zone: {
                    warehouseId: effectiveWarehouseId,
                },
            },
        });
    }
    const result = await queryBuilder.execute();
    return result;
};
const getShelfById = async (id) => {
    const shelf = await prisma.shelf.findFirst({
        where: { id, isDeleted: false },
        include: {
            aisle: true,
            bins: {
                where: { isDeleted: false },
            },
        },
    });
    if (!shelf) {
        throw new AppError(httpStatus.NOT_FOUND, "Shelf not found.");
    }
    return shelf;
};
const getShelfBins = async (id) => {
    const shelf = await prisma.shelf.findFirst({
        where: { id, isDeleted: false },
    });
    if (!shelf) {
        throw new AppError(httpStatus.NOT_FOUND, "Shelf not found.");
    }
    const bins = await prisma.bin.findMany({
        where: { shelfId: id, isDeleted: false },
    });
    return bins;
};
const updateShelf = async (id, payload) => {
    const existingShelf = await prisma.shelf.findFirst({
        where: { id, isDeleted: false },
    });
    if (!existingShelf) {
        throw new AppError(httpStatus.NOT_FOUND, "Shelf not found.");
    }
    const targetAisleId = payload.aisleId ?? existingShelf.aisleId;
    const targetCode = payload.code ?? existingShelf.code;
    // If changing aisle, validate new aisle & ensure no active child bins
    if (payload.aisleId && payload.aisleId !== existingShelf.aisleId) {
        const aisle = await prisma.aisle.findFirst({
            where: { id: payload.aisleId, isDeleted: false },
        });
        if (!aisle) {
            throw new AppError(httpStatus.NOT_FOUND, "Target aisle not found.");
        }
        if (aisle.status !== LocationStatus.ACTIVE) {
            throw new AppError(httpStatus.BAD_REQUEST, "Cannot move Shelf: Target aisle is inactive.");
        }
        const activeBinCount = await prisma.bin.count({
            where: { shelfId: id, isDeleted: false },
        });
        if (activeBinCount > 0) {
            throw new AppError(httpStatus.BAD_REQUEST, "Cannot move Shelf to another aisle while active bins exist under it.");
        }
    }
    // Check capacity if provided
    if (payload.capacity !== undefined && payload.capacity < 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Capacity must be greater than or equal to 0.");
    }
    // Check code uniqueness in target aisle
    if (payload.code || payload.aisleId) {
        const duplicateShelf = await prisma.shelf.findFirst({
            where: {
                aisleId: targetAisleId,
                code: targetCode,
                isDeleted: false,
                NOT: { id },
            },
        });
        if (duplicateShelf) {
            throw new AppError(httpStatus.CONFLICT, `Shelf code '${targetCode}' already exists in target aisle.`);
        }
    }
    const updatedShelf = await prisma.shelf.update({
        where: { id },
        data: payload,
        include: {
            aisle: true,
        },
    });
    return updatedShelf;
};
const updateShelfStatus = async (id, payload) => {
    const existingShelf = await prisma.shelf.findFirst({
        where: { id, isDeleted: false },
    });
    if (!existingShelf) {
        throw new AppError(httpStatus.NOT_FOUND, "Shelf not found.");
    }
    const updatedShelf = await prisma.shelf.update({
        where: { id },
        data: { status: payload.status },
        include: {
            aisle: true,
        },
    });
    return updatedShelf;
};
const deleteShelf = async (id) => {
    const existingShelf = await prisma.shelf.findFirst({
        where: { id, isDeleted: false },
    });
    if (!existingShelf) {
        throw new AppError(httpStatus.NOT_FOUND, "Shelf not found.");
    }
    // Check active bins
    const activeBinCount = await prisma.bin.count({
        where: { shelfId: id, isDeleted: false },
    });
    if (activeBinCount > 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Cannot delete shelf while active bins exist.");
    }
    const deletedShelf = await prisma.shelf.update({
        where: { id },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
        },
    });
    return deletedShelf;
};
export const ShelfService = {
    createShelf,
    getAllShelves,
    getShelfById,
    getShelfBins,
    updateShelf,
    updateShelfStatus,
    deleteShelf,
};
