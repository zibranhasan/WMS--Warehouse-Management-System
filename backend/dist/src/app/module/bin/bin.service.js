import httpStatus from "http-status";
import { LocationStatus } from "../../../generated/prisma/index.js";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { binFilterableFields, binSearchableFields } from "./bin.constant";
const createBin = async (payload) => {
    // 1. Validate parent shelf exists, is active, and is not deleted
    const shelf = await prisma.shelf.findFirst({
        where: { id: payload.shelfId, isDeleted: false },
    });
    if (!shelf) {
        throw new AppError(httpStatus.NOT_FOUND, "Shelf not found.");
    }
    if (shelf.status !== LocationStatus.ACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, "Cannot create Bin: Parent Shelf is inactive.");
    }
    // 2. Validate capacity
    if (payload.capacity !== undefined && payload.capacity < 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Capacity must be greater than or equal to 0.");
    }
    // 3. Check for duplicate code within the shelf
    const existingBin = await prisma.bin.findFirst({
        where: {
            shelfId: payload.shelfId,
            code: payload.code,
            isDeleted: false,
        },
    });
    if (existingBin) {
        throw new AppError(httpStatus.CONFLICT, `Bin code '${payload.code}' already exists in this shelf.`);
    }
    const result = await prisma.bin.create({
        data: {
            shelfId: payload.shelfId,
            code: payload.code,
            name: payload.name,
            description: payload.description,
            capacity: payload.capacity ?? 0,
        },
        include: {
            shelf: true,
        },
    });
    return result;
};
const getAllBins = async (query, warehouseScope) => {
    const filterQuery = { isDeleted: "false", ...query };
    const shelfWhere = {};
    // Determine authoritative warehouse ID (warehouseScope takes precedence)
    const effectiveWarehouseId = warehouseScope || filterQuery.warehouseId;
    // Remove warehouseId from filterQuery to avoid QueryBuilder creating an invalid relation query
    delete filterQuery.warehouseId;
    delete filterQuery["shelf.aisle.zone.warehouseId"];
    if (effectiveWarehouseId) {
        shelfWhere.aisle = {
            ...(shelfWhere.aisle || {}),
            zone: {
                ...(shelfWhere.aisle?.zone || {}),
                warehouseId: effectiveWarehouseId,
            },
        };
    }
    if (filterQuery.zoneId) {
        shelfWhere.aisle = {
            ...(shelfWhere.aisle || {}),
            zoneId: filterQuery.zoneId,
        };
        delete filterQuery.zoneId;
    }
    if (filterQuery.aisleId) {
        shelfWhere.aisleId = filterQuery.aisleId;
        delete filterQuery.aisleId;
    }
    const queryBuilder = new QueryBuilder(prisma.bin, filterQuery, {
        searchableFields: binSearchableFields,
        filterableFields: binFilterableFields,
    })
        .search()
        .filter();
    if (Object.keys(shelfWhere).length > 0) {
        queryBuilder.where({ shelf: shelfWhere });
    }
    queryBuilder
        .sort()
        .paginate()
        .fields()
        .include({
        shelf: {
            include: {
                aisle: {
                    include: {
                        zone: {
                            include: {
                                warehouse: true,
                            },
                        },
                    },
                },
            },
        },
    });
    const result = await queryBuilder.execute();
    return result;
};
const getBinById = async (id) => {
    const bin = await prisma.bin.findFirst({
        where: { id, isDeleted: false },
        include: {
            shelf: true,
        },
    });
    if (!bin) {
        throw new AppError(httpStatus.NOT_FOUND, "Bin not found.");
    }
    return bin;
};
const updateBin = async (id, payload) => {
    const existingBin = await prisma.bin.findFirst({
        where: { id, isDeleted: false },
    });
    if (!existingBin) {
        throw new AppError(httpStatus.NOT_FOUND, "Bin not found.");
    }
    const targetShelfId = payload.shelfId ?? existingBin.shelfId;
    const targetCode = payload.code ?? existingBin.code;
    // If changing shelf, validate new shelf
    if (payload.shelfId && payload.shelfId !== existingBin.shelfId) {
        const shelf = await prisma.shelf.findFirst({
            where: { id: payload.shelfId, isDeleted: false },
        });
        if (!shelf) {
            throw new AppError(httpStatus.NOT_FOUND, "Target shelf not found.");
        }
        if (shelf.status !== LocationStatus.ACTIVE) {
            throw new AppError(httpStatus.BAD_REQUEST, "Cannot move Bin: Target shelf is inactive.");
        }
    }
    // Check capacity if provided
    if (payload.capacity !== undefined && payload.capacity < 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Capacity must be greater than or equal to 0.");
    }
    // Check code uniqueness in target shelf
    if (payload.code || payload.shelfId) {
        const duplicateBin = await prisma.bin.findFirst({
            where: {
                shelfId: targetShelfId,
                code: targetCode,
                isDeleted: false,
                NOT: { id },
            },
        });
        if (duplicateBin) {
            throw new AppError(httpStatus.CONFLICT, `Bin code '${targetCode}' already exists in target shelf.`);
        }
    }
    const updatedBin = await prisma.bin.update({
        where: { id },
        data: payload,
        include: {
            shelf: true,
        },
    });
    return updatedBin;
};
const updateBinStatus = async (id, payload) => {
    const existingBin = await prisma.bin.findFirst({
        where: { id, isDeleted: false },
    });
    if (!existingBin) {
        throw new AppError(httpStatus.NOT_FOUND, "Bin not found.");
    }
    const updatedBin = await prisma.bin.update({
        where: { id },
        data: { status: payload.status },
        include: {
            shelf: true,
        },
    });
    return updatedBin;
};
const deleteBin = async (id) => {
    const existingBin = await prisma.bin.findFirst({
        where: { id, isDeleted: false },
    });
    if (!existingBin) {
        throw new AppError(httpStatus.NOT_FOUND, "Bin not found.");
    }
    const deletedBin = await prisma.bin.update({
        where: { id },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
        },
    });
    return deletedBin;
};
export const BinService = {
    createBin,
    getAllBins,
    getBinById,
    updateBin,
    updateBinStatus,
    deleteBin,
};
