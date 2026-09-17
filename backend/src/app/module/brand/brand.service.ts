import httpStatus from "http-status";
import { Prisma } from "../../../generated/prisma/index.js";
import { Brand } from "../../../generated/prisma/index.js";
import AppError from "../../errorHelpers/AppError.js";
import { IQueryParams } from "../../interfaces/query.interface.js";
import { prisma } from "../../lib/prisma.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import {
    brandFilterableFields,
    brandSearchableFields,
} from "./brand.constant.js";
import {
    ICreateBrand,
    IUpdateBrand,
    IUpdateBrandStatus,
} from "./brand.interface.js";

const MAX_SLUG_RETRIES = 10;

const generateSlug = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

const findUniqueSlug = async (
    baseSlug: string,
    excludeId?: string,
): Promise<string> => {
    let candidate = baseSlug;
    let counter = 2;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const existing = await prisma.brand.findFirst({
            where: {
                slug: candidate,
                ...(excludeId ? { id: { not: excludeId } } : {}),
            },
        });

        if (!existing) {
            return candidate;
        }

        candidate = `${baseSlug}-${counter}`;
        counter++;
    }
};

const isSlugConstraintViolation = (
    error: unknown,
): error is Prisma.PrismaClientKnownRequestError => {
    return (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.includes("slug")
    );
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

    const baseSlug = generateSlug(payload.name);
    let candidate = await findUniqueSlug(baseSlug);
    let counter = candidate === baseSlug ? 2 : parseInt(candidate.slice(baseSlug.length + 1), 10) + 1;

    for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
        try {
            const result = await prisma.brand.create({
                data: {
                    ...payload,
                    slug: candidate,
                },
            });
            return result;
        } catch (error) {
            if (isSlugConstraintViolation(error)) {
                candidate = `${baseSlug}-${counter}`;
                counter++;
                continue;
            }
            throw error;
        }
    }

    throw new AppError(
        httpStatus.CONFLICT,
        "Unable to generate a unique slug. Please try again.",
    );
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

    let slug: string | undefined;
    if (payload.name && payload.name !== existingBrand.name) {
        const baseSlug = generateSlug(payload.name);
        let candidate = await findUniqueSlug(baseSlug, id);
        let counter = candidate === baseSlug ? 2 : parseInt(candidate.slice(baseSlug.length + 1), 10) + 1;

        for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
            try {
                const updatedBrand = await prisma.brand.update({
                    where: { id },
                    data: {
                        ...payload,
                        slug: candidate,
                    },
                });
                return updatedBrand;
            } catch (error) {
                if (isSlugConstraintViolation(error)) {
                    candidate = `${baseSlug}-${counter}`;
                    counter++;
                    continue;
                }
                throw error;
            }
        }

        throw new AppError(
            httpStatus.CONFLICT,
            "Unable to generate a unique slug. Please try again.",
        );
    }

    const updatedBrand = await prisma.brand.update({
        where: { id },
        data: {
            ...payload,
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
