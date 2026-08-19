import httpStatus from "http-status";
import { Supplier } from "../../../generated/prisma/index.js";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
    supplierFilterableFields,
    supplierSearchableFields,
} from "./supplier.constant";
import {
    ICreateSupplier,
    IUpdateSupplier,
    IUpdateSupplierStatus,
} from "./supplier.interface";

const createSupplier = async (payload: ICreateSupplier) => {
    const existingCode = await prisma.supplier.findFirst({
        where: {
            code: payload.code,
            isDeleted: false,
        },
    });

    if (existingCode) {
        throw new AppError(
            httpStatus.CONFLICT,
            "Supplier with this code already exists.",
        );
    }

    const result = await prisma.supplier.create({
        data: payload,
    });

    return result;
};

const getAllSuppliers = async (query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder<Supplier>(
        prisma.supplier,
        query as IQueryParams,
        {
            searchableFields: supplierSearchableFields,
            filterableFields: supplierFilterableFields,
        },
    )
        .where({ isDeleted: false })
        .search()
        .filter()
        .sort()
        .paginate()
        .fields();

    return await queryBuilder.execute();
};

const getSupplierById = async (id: string) => {
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

const updateSupplier = async (id: string, payload: IUpdateSupplier) => {
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
            throw new AppError(
                httpStatus.CONFLICT,
                "Supplier with this code already exists.",
            );
        }
    }

    const updatedSupplier = await prisma.supplier.update({
        where: { id },
        data: payload,
    });

    return updatedSupplier;
};

const updateSupplierStatus = async (
    id: string,
    payload: IUpdateSupplierStatus,
) => {
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

const deleteSupplier = async (id: string) => {
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
