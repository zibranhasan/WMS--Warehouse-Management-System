import httpStatus from "http-status";
import {
    BrandStatus,
    CategoryStatus,
    Prisma,
    Product,
} from "../../../generated/prisma/index.js";
import { deleteFileFromCloudinary } from "../../config/cloudinary.config.js";
import AppError from "../../errorHelpers/AppError.js";
import { IQueryParams } from "../../interfaces/query.interface.js";
import { prisma } from "../../lib/prisma.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import {
    productFilterableFields,
    productSearchableFields,
} from "./product.constant.js";
import {
    ICreateProduct,
    IUpdateProduct,
    IUpdateProductStatus,
} from "./product.interface.js";

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
        const existing = await prisma.product.findFirst({
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

    const baseSlug = generateSlug(payload.name);
    let candidate = await findUniqueSlug(baseSlug);
    let counter = candidate === baseSlug ? 2 : parseInt(candidate.slice(baseSlug.length + 1), 10) + 1;

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

    for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
        try {
            const result = await prisma.product.create({
                data: {
                    ...payload,
                    slug: candidate,
                    image: imageUrl ?? null,
                },
                include: {
                    category: true,
                    brand: true,
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

    let slug: string | undefined;
    if (payload.name && payload.name !== existingProduct.name) {
        const baseSlug = generateSlug(payload.name);
        let candidate = await findUniqueSlug(baseSlug, id);
        let counter = candidate === baseSlug ? 2 : parseInt(candidate.slice(baseSlug.length + 1), 10) + 1;

        for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
            try {
                // Validate category if changed (must happen before slug retry loop)
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

                // Validate brand if changed
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

                // Resolve image field
                const oldImageUrl: string | null = existingProduct.image;
                let newImageValue: string | null | undefined = undefined;

                if (imageUrl) {
                    newImageValue = imageUrl;
                } else if (removeImage === true && !imageUrl) {
                    newImageValue = null;
                }

                const { removeImage: _removeImage, ...dbPayload } = payload;

                const updatedProduct = await prisma.product.update({
                    where: { id },
                    data: {
                        ...dbPayload,
                        slug: candidate,
                        ...(newImageValue !== undefined && { image: newImageValue }),
                    },
                    include: {
                        category: true,
                        brand: true,
                    },
                });

                if (oldImageUrl && newImageValue !== undefined) {
                    await deleteFileFromCloudinary(oldImageUrl).catch((err) => {
                        console.error("Failed to delete old product image from Cloudinary:", err);
                    });
                }

                return updatedProduct;
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

    // No name change — slug stays the same, apply other updates normally
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

    const oldImageUrl: string | null = existingProduct.image;
    let newImageValue: string | null | undefined = undefined;

    if (imageUrl) {
        newImageValue = imageUrl;
    } else if (removeImage === true && !imageUrl) {
        newImageValue = null;
    }

    const { removeImage: _removeImage, ...dbPayload } = payload;

    const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
            ...dbPayload,
            ...(newImageValue !== undefined && { image: newImageValue }),
        },
        include: {
            category: true,
            brand: true,
        },
    });

    if (oldImageUrl && newImageValue !== undefined) {
        await deleteFileFromCloudinary(oldImageUrl).catch((err) => {
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
