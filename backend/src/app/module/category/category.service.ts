import httpStatus from "http-status";
import { Category } from "../../../generated/prisma/index.js";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
    categoryFilterableFields,
    categorySearchableFields,
} from "./category.constant";
import {
    ICreateCategory,
    IUpdateCategory,
    IUpdateCategoryStatus,
} from "./category.interface";

const generateSlug = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

const createCategory = async (payload: ICreateCategory) => {
    const existingName = await prisma.category.findFirst({
        where: {
            name: payload.name,
            isDeleted: false,
        },
    });

    if (existingName) {
        throw new AppError(
            httpStatus.CONFLICT,
            "Category with this name already exists.",
        );
    }

    const slug = payload.slug
        ? generateSlug(payload.slug)
        : generateSlug(payload.name);

    const existingSlug = await prisma.category.findFirst({
        where: {
            slug,
            isDeleted: false,
        },
    });

    if (existingSlug) {
        throw new AppError(
            httpStatus.CONFLICT,
            "Category with this slug already exists.",
        );
    }

    const result = await prisma.category.create({
        data: {
            ...payload,
            slug,
        },
    });

    return result;
};

const getAllCategories = async (query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder<Category>(
        prisma.category,
        query as IQueryParams,
        {
            searchableFields: categorySearchableFields,
            filterableFields: categoryFilterableFields,
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

const getCategoryById = async (id: string) => {
    const category = await prisma.category.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!category) {
        throw new AppError(httpStatus.NOT_FOUND, "Category not found.");
    }

    return category;
};

const updateCategory = async (id: string, payload: IUpdateCategory) => {
    const existingCategory = await prisma.category.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!existingCategory) {
        throw new AppError(httpStatus.NOT_FOUND, "Category not found.");
    }

    let slug = payload.slug
        ? generateSlug(payload.slug)
        : payload.name
          ? generateSlug(payload.name)
          : undefined;

    if (payload.name && payload.name !== existingCategory.name) {
        const duplicateName = await prisma.category.findFirst({
            where: {
                name: payload.name,
                id: { not: id },
                isDeleted: false,
            },
        });

        if (duplicateName) {
            throw new AppError(
                httpStatus.CONFLICT,
                "Category with this name already exists.",
            );
        }
    }

    if (slug && slug !== existingCategory.slug) {
        const duplicateSlug = await prisma.category.findFirst({
            where: {
                slug,
                id: { not: id },
                isDeleted: false,
            },
        });

        if (duplicateSlug) {
            throw new AppError(
                httpStatus.CONFLICT,
                "Category with this slug already exists.",
            );
        }
    }

    const updatedCategory = await prisma.category.update({
        where: { id },
        data: {
            ...payload,
            ...(slug && { slug }),
        },
    });

    return updatedCategory;
};

const updateCategoryStatus = async (
    id: string,
    payload: IUpdateCategoryStatus,
) => {
    const existingCategory = await prisma.category.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!existingCategory) {
        throw new AppError(httpStatus.NOT_FOUND, "Category not found.");
    }

    const updatedCategory = await prisma.category.update({
        where: { id },
        data: {
            status: payload.status,
        },
    });

    return updatedCategory;
};

const deleteCategory = async (id: string) => {
    const existingCategory = await prisma.category.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!existingCategory) {
        throw new AppError(httpStatus.NOT_FOUND, "Category not found.");
    }

    const softDeletedCategory = await prisma.category.update({
        where: { id },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
        },
    });

    return softDeletedCategory;
};

export const CategoryService = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    updateCategoryStatus,
    deleteCategory,
};
