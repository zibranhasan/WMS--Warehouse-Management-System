import httpStatus from "http-status";
import { Brand } from "../../../generated/prisma/index.js";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
    brandFilterableFields,
    brandSearchableFields,
} from "./brand.constant";
import {
    ICreateBrand,
    IUpdateBrand,
    IUpdateBrandStatus,
} from "./brand.interface";

const generateSlug = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

const createBrand = async (payload: ICreateBrand) => {
    const existingName = await prisma.brand.findFirst({
        where: {
            name: payload.name,
            isDeleted: false,
        },
    });

    if (existingName) {
        throw new AppError(
            httpStatus.CONFLICT,
            "Brand with this name already exists.",
        );
    }

    const slug = payload.slug
        ? generateSlug(payload.slug)
        : generateSlug(payload.name);

    const existingSlug = await prisma.brand.findFirst({
        where: {
            slug,
            isDeleted: false,
        },
    });

    if (existingSlug) {
        throw new AppError(
            httpStatus.CONFLICT,
            "Brand with this slug already exists.",
        );
    }

    const result = await prisma.brand.create({
        data: {
            ...payload,
            slug,
        },
    });

    return result;
};

const getAllBrands = async (query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder<Brand>(
        prisma.brand,
        query as IQueryParams,
        {
            searchableFields: brandSearchableFields,
            filterableFields: brandFilterableFields,
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

const getBrandById = async (id: string) => {
    const brand = await prisma.brand.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!brand) {
        throw new AppError(httpStatus.NOT_FOUND, "Brand not found.");
    }

    return brand;
};

const updateBrand = async (id: string, payload: IUpdateBrand) => {
    const existingBrand = await prisma.brand.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!existingBrand) {
        throw new AppError(httpStatus.NOT_FOUND, "Brand not found.");
    }

    let slug = payload.slug
        ? generateSlug(payload.slug)
        : payload.name
          ? generateSlug(payload.name)
          : undefined;

    if (payload.name && payload.name !== existingBrand.name) {
        const duplicateName = await prisma.brand.findFirst({
            where: {
                name: payload.name,
                id: { not: id },
                isDeleted: false,
            },
        });

        if (duplicateName) {
            throw new AppError(
                httpStatus.CONFLICT,
                "Brand with this name already exists.",
            );
        }
    }

    if (slug && slug !== existingBrand.slug) {
        const duplicateSlug = await prisma.brand.findFirst({
            where: {
                slug,
                id: { not: id },
                isDeleted: false,
            },
        });

        if (duplicateSlug) {
            throw new AppError(
                httpStatus.CONFLICT,
                "Brand with this slug already exists.",
            );
        }
    }

    const updatedBrand = await prisma.brand.update({
        where: { id },
        data: {
            ...payload,
            ...(slug && { slug }),
        },
    });

    return updatedBrand;
};

const updateBrandStatus = async (
    id: string,
    payload: IUpdateBrandStatus,
) => {
    const existingBrand = await prisma.brand.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!existingBrand) {
        throw new AppError(httpStatus.NOT_FOUND, "Brand not found.");
    }

    const updatedBrand = await prisma.brand.update({
        where: { id },
        data: {
            status: payload.status,
        },
    });

    return updatedBrand;
};

const deleteBrand = async (id: string) => {
    const existingBrand = await prisma.brand.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!existingBrand) {
        throw new AppError(httpStatus.NOT_FOUND, "Brand not found.");
    }

    const softDeletedBrand = await prisma.brand.update({
        where: { id },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
        },
    });

    return softDeletedBrand;
};

export const BrandService = {
    createBrand,
    getAllBrands,
    getBrandById,
    updateBrand,
    updateBrandStatus,
    deleteBrand,
};
