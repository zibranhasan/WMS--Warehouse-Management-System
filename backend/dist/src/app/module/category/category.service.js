import httpStatus from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { categoryFilterableFields, categorySearchableFields, } from "./category.constant";
const generateSlug = (text) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};
const createCategory = async (payload) => {
    const existingName = await prisma.category.findFirst({
        where: {
            name: payload.name,
            isDeleted: false,
        },
    });
    if (existingName) {
        throw new AppError(httpStatus.CONFLICT, "Category with this name already exists.");
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
        throw new AppError(httpStatus.CONFLICT, "Category with this slug already exists.");
    }
    const result = await prisma.category.create({
        data: {
            ...payload,
            slug,
        },
    });
    return result;
};
const getAllCategories = async (query) => {
    const queryBuilder = new QueryBuilder(prisma.category, query, {
        searchableFields: categorySearchableFields,
        filterableFields: categoryFilterableFields,
    })
        .where({ isDeleted: false })
        .search()
        .filter()
        .sort()
        .paginate()
        .fields();
    const result = await queryBuilder.execute();
    return result;
};
const getCategoryById = async (id) => {
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
const updateCategory = async (id, payload) => {
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
            throw new AppError(httpStatus.CONFLICT, "Category with this name already exists.");
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
            throw new AppError(httpStatus.CONFLICT, "Category with this slug already exists.");
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
const updateCategoryStatus = async (id, payload) => {
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
const deleteCategory = async (id) => {
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
