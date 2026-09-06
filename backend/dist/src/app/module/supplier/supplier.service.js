import httpStatus from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { supplierFilterableFields, supplierSearchableFields, } from "./supplier.constant";
const createSupplier = async (payload) => {
    const existingCode = await prisma.supplier.findFirst({
        where: {
            code: payload.code,
            isDeleted: false,
        },
    });
    if (existingCode) {
        throw new AppError(httpStatus.CONFLICT, "Supplier with this code already exists.");
    }
    const result = await prisma.supplier.create({
        data: payload,
    });
    return result;
};
const getAllSuppliers = async (query) => {
    const queryBuilder = new QueryBuilder(prisma.supplier, query, {
        searchableFields: supplierSearchableFields,
        filterableFields: supplierFilterableFields,
    })
        .where({ isDeleted: false })
        .search()
        .filter()
        .sort()
        .paginate()
        .fields();
    return await queryBuilder.execute();
};
const getSupplierById = async (id) => {
    const supplier = await prisma.supplier.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });
    if (!supplier) {
        throw new AppError(httpStatus.NOT_FOUND, "Supplier not found.");
    }
    return supplier;
};
const updateSupplier = async (id, payload) => {
    const existingSupplier = await prisma.supplier.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });
    if (!existingSupplier) {
        throw new AppError(httpStatus.NOT_FOUND, "Supplier not found.");
    }
    if (payload.code && payload.code !== existingSupplier.code) {
        const duplicateCode = await prisma.supplier.findFirst({
            where: {
                code: payload.code,
                id: { not: id },
                isDeleted: false,
            },
        });
        if (duplicateCode) {
            throw new AppError(httpStatus.CONFLICT, "Supplier with this code already exists.");
        }
    }
    const updatedSupplier = await prisma.supplier.update({
        where: { id },
        data: payload,
    });
    return updatedSupplier;
};
const updateSupplierStatus = async (id, payload) => {
    const existingSupplier = await prisma.supplier.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });
    if (!existingSupplier) {
        throw new AppError(httpStatus.NOT_FOUND, "Supplier not found.");
    }
    const updatedSupplier = await prisma.supplier.update({
        where: { id },
        data: {
            status: payload.status,
        },
    });
    return updatedSupplier;
};
const deleteSupplier = async (id) => {
    const existingSupplier = await prisma.supplier.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });
    if (!existingSupplier) {
        throw new AppError(httpStatus.NOT_FOUND, "Supplier not found.");
    }
    const softDeletedSupplier = await prisma.supplier.update({
        where: { id },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
        },
    });
    return softDeletedSupplier;
};
export const SupplierService = {
    createSupplier,
    getAllSuppliers,
    getSupplierById,
    updateSupplier,
    updateSupplierStatus,
    deleteSupplier,
};
