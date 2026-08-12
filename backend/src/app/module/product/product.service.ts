import httpStatus from "http-status";
import {
    BrandStatus,
    CategoryStatus,
    Product,
} from "../../../generated/prisma/index.js";
import { deleteFileFromCloudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
    productFilterableFields,
    productSearchableFields,
} from "./product.constant";
import {
    ICreateProduct,
    IUpdateProduct,
    IUpdateProductStatus,
} from "./product.interface";

const generateSlug = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

const createProduct = async (payload: ICreateProduct, imageUrl?: string) => {
    const existingSku = await prisma.product.findFirst({
        where: {
            sku: payload.sku,
            isDeleted: false,
        },
    });

    if (existingSku) {
        throw new AppError(
            httpStatus.CONFLICT,
            "Product with this SKU already exists.",
        );
    }

    const slug = payload.slug
        ? generateSlug(payload.slug)
        : generateSlug(payload.name);

    const existingSlug = await prisma.product.findFirst({
        where: {
            slug,
            isDeleted: false,
        },
    });

    if (existingSlug) {
        throw new AppError(
            httpStatus.CONFLICT,
            "Product with this slug already exists.",
        );
    }

    const category = await prisma.category.findFirst({
        where: {
            id: payload.categoryId,
            isDeleted: false,
        },
    });

    if (!category) {
        throw new AppError(httpStatus.NOT_FOUND, "Category not found.");
    }

    if (category.status !== CategoryStatus.ACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, "Category is inactive.");
    }

    if (payload.brandId) {
        const brand = await prisma.brand.findFirst({
            where: {
                id: payload.brandId,
                isDeleted: false,
            },
        });

        if (!brand) {
            throw new AppError(httpStatus.NOT_FOUND, "Brand not found.");
        }

        if (brand.status !== BrandStatus.ACTIVE) {
            throw new AppError(httpStatus.BAD_REQUEST, "Brand is inactive.");
        }
    }

    const result = await prisma.product.create({
        data: {
            ...payload,
            slug,
            image: imageUrl ?? null,
        },
        include: {
            category: true,
            brand: true,
        },
    });

    return result;
};

const getAllProducts = async (query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder<Product>(
        prisma.product,
        query as IQueryParams,
        {
            searchableFields: productSearchableFields,
            filterableFields: productFilterableFields,
        },
    )
        .where({ isDeleted: false })
        .include({ category: true, brand: true })
        .search()
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await queryBuilder.execute();

    return result;
};

const getProductById = async (id: string) => {
    const product = await prisma.product.findFirst({
        where: {
            id,
            isDeleted: false,
        },
        include: {
            category: true,
            brand: true,
        },
    });

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found.");
    }

    return product;
};

const getProductBySku = async (sku: string) => {
    const product = await prisma.product.findFirst({
        where: {
            sku,
            isDeleted: false,
        },
        include: {
            category: true,
            brand: true,
        },
    });

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found.");
    }

    return product;
};

const updateProduct = async (
    id: string,
    payload: IUpdateProduct,
    imageUrl?: string,
    removeImage?: boolean,
) => {
    const existingProduct = await prisma.product.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!existingProduct) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found.");
    }

    if (payload.sku && payload.sku !== existingProduct.sku) {
        const duplicateSku = await prisma.product.findFirst({
            where: {
                sku: payload.sku,
                id: { not: id },
                isDeleted: false,
            },
        });

        if (duplicateSku) {
            throw new AppError(
                httpStatus.CONFLICT,
                "Product with this SKU already exists.",
            );
        }
    }

    let slug = payload.slug
        ? generateSlug(payload.slug)
        : payload.name
          ? generateSlug(payload.name)
          : undefined;

    if (slug && slug !== existingProduct.slug) {
        const duplicateSlug = await prisma.product.findFirst({
            where: {
                slug,
                id: { not: id },
                isDeleted: false,
            },
        });

        if (duplicateSlug) {
            throw new AppError(
                httpStatus.CONFLICT,
                "Product with this slug already exists.",
            );
        }
    }

    if (payload.categoryId && payload.categoryId !== existingProduct.categoryId) {
        const category = await prisma.category.findFirst({
            where: {
                id: payload.categoryId,
                isDeleted: false,
            },
        });

        if (!category) {
            throw new AppError(httpStatus.NOT_FOUND, "Category not found.");
        }

        if (category.status !== CategoryStatus.ACTIVE) {
            throw new AppError(httpStatus.BAD_REQUEST, "Category is inactive.");
        }
    }

    if (payload.brandId && payload.brandId !== existingProduct.brandId) {
        const brand = await prisma.brand.findFirst({
            where: {
                id: payload.brandId,
                isDeleted: false,
            },
        });

        if (!brand) {
            throw new AppError(httpStatus.NOT_FOUND, "Brand not found.");
        }

        if (brand.status !== BrandStatus.ACTIVE) {
            throw new AppError(httpStatus.BAD_REQUEST, "Brand is inactive.");
        }
    }

    // -----------------------------------------------------------------------
    // Resolve image field and track old URL for post-update Cloudinary cleanup
    // -----------------------------------------------------------------------
    const oldImageUrl: string | null = existingProduct.image;
    let newImageValue: string | null | undefined = undefined; // undefined = no change

    if (imageUrl) {
        // A new file was uploaded — replace the image
        newImageValue = imageUrl;
    } else if (removeImage === true && !imageUrl) {
        // Explicit removal requested and no new file uploaded — clear the image
        newImageValue = null;
    }
    // else: no image change — newImageValue stays undefined

    // Strip removeImage from the DB payload (Prisma does not know this field)
    const { removeImage: _removeImage, ...dbPayload } = payload;

    const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
            ...dbPayload,
            ...(slug && { slug }),
            ...(newImageValue !== undefined && { image: newImageValue }),
        },
        include: {
            category: true,
            brand: true,
        },
    });

    // -----------------------------------------------------------------------
    // Delete old Cloudinary image AFTER successful DB update
    // -----------------------------------------------------------------------
    if (oldImageUrl && newImageValue !== undefined) {
        // Only delete if we actually changed/removed the image and there was an old one
        await deleteFileFromCloudinary(oldImageUrl).catch((err) => {
            // Log but don't fail the request — DB update already succeeded
            console.error("Failed to delete old product image from Cloudinary:", err);
        });
    }

    return updatedProduct;
};

const updateProductStatus = async (
    id: string,
    payload: IUpdateProductStatus,
) => {
    const existingProduct = await prisma.product.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!existingProduct) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found.");
    }

    const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
            status: payload.status,
        },
        include: {
            category: true,
            brand: true,
        },
    });

    return updatedProduct;
};

const deleteProduct = async (id: string) => {
    const existingProduct = await prisma.product.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!existingProduct) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found.");
    }

    const softDeletedProduct = await prisma.product.update({
        where: { id },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
        },
    });

    return softDeletedProduct;
};

export const ProductService = {
    createProduct,
    getAllProducts,
    getProductById,
    getProductBySku,
    updateProduct,
    updateProductStatus,
    deleteProduct,
};
